import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

// JWT verification function
const verifyToken = async (request: NextRequest) => {
    const token = request.cookies.get('token')?.value ||
                 request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;
        return decoded;
    }
    catch (error) {
        console.error("Token verification error:", error);
        return null;
    }
};

// Database connection function
const getConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'coursesite',
    });
};

// POST to enroll a student in a course
export async function POST(
    request: NextRequest,
    { params }: { params: { courseId: string } }
) {
    // Validate user authentication
    const user = await verifyToken(request);
    if (!user) {
        return NextResponse.json(
            { message: "Unauthorized access" },
            { status: 401 }
        );
    }

    // Verify user is a student
    if (user.role !== 'student') {
        return NextResponse.json(
            { message: "Only students can enroll in courses" },
            { status: 403 }
        );
    }

    // Validate courseId parameter
    const courseId = params.courseId;
    if (!courseId || isNaN(Number(courseId))) {
        console.log("Invalid courseId:", courseId);
        return NextResponse.json(
            { message: "Invalid course ID" },
            { status: 400 }
        );
    }

    try {
        const connection = await getConnection();

        // Check if the course exists and is published
        const [courseRows] = await connection.execute(`
            SELECT id, status, school_id
            FROM courses
            WHERE id = ? AND status = 'published'
        `, [courseId]);

        if (!Array.isArray(courseRows) || courseRows.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "Course not found or not available for enrollment" },
                { status: 404 }
            );
        }

        // Define proper type for the course row
        interface CourseRow {
            id: number;
            status: string;
            school_id: number | null;
        }
        
        const course = (courseRows as CourseRow[])[0];

        // Check if student belongs to the school if course has school_id
        if (course.school_id) {
            const [studentRows] = await connection.execute(`
                SELECT school_id
                FROM users
                WHERE id = ? AND role = 'student'
            `, [user.id]);

            if (!Array.isArray(studentRows) || studentRows.length === 0) {
                await connection.end();
                return NextResponse.json(
                    { message: "Student not found" },
                    { status: 404 }
                );
            }

            // Define proper type for the student row
            interface StudentRow {
                school_id: number | null;
            }
            
            const student = (studentRows as StudentRow[])[0];
            
            if (student.school_id !== course.school_id) {
                await connection.end();
                return NextResponse.json(
                    { message: "You cannot enroll in courses from other schools" },
                    { status: 403 }
                );
            }
        }

        // Check if already enrolled
        const [enrollmentRows] = await connection.execute(`
            SELECT id, status
            FROM enrollments
            WHERE student_id = ? AND course_id = ?
        `, [user.id, courseId]);

        // Define proper type for the enrollment row
        interface EnrollmentRow {
            id: number;
            status: string;
        }

        // If already enrolled, return the existing enrollment
        if (Array.isArray(enrollmentRows) && enrollmentRows.length > 0) {
            const enrollment = (enrollmentRows as EnrollmentRow[])[0];
            
            await connection.end();
            return NextResponse.json({
                message: "Already enrolled in this course",
                enrollment: enrollment
            });
        }

        // Create new enrollment
        const [result] = await connection.execute(`
            INSERT INTO enrollments (student_id, course_id, enrolled_at, status)
            VALUES (?, ?, NOW(), 'active')
        `, [user.id, courseId]);

        // Create notification for the student
        await connection.execute(`
            INSERT INTO notifications (user_id, message, created_at)
            VALUES (?, ?, NOW())
        `, [user.id, `You have successfully enrolled in a new course. Course ID: ${courseId}`]);

        // Get the enrollment ID
        const enrollmentId = (result as any).insertId;
        
        await connection.end();

        return NextResponse.json({
            message: "Successfully enrolled in the course",
            enrollment: {
                id: enrollmentId,
                status: 'active'
            }
        }, { status: 201 });
    }
    catch (error) {
        console.error("Error enrolling in course:", error);
        return NextResponse.json(
            { message: "Failed to enroll in course", error: String(error) },
            { status: 500 }
        );
    }
}