import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const verifyTeacherToken = async (request: NextRequest) => {
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;

        if (decoded.role !== 'teacher'){
            return null;
        }
        
        return decoded;
    }
    catch (error) {
        console.error("Token verification error:", error);
        return null;
    }
};

const getConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'coursesite',
    });
};

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    // Fixed: Access params via context
    const { params } = context;
    const courseId = params.id;
    
    const teacher = await verifyTeacherToken(request);
    if (!teacher){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        // Fetch the teacher ID from the database using the email in the token
        if (!teacher.email) {
            return NextResponse.json(
                { message: "Teacher email not found in token" },
                { status: 400 }
            );
        }
        
        const connection = await getConnection();
        
        // First, get the teacher's ID from the database
        const [teacherRows] = await connection.execute(
            "SELECT id FROM users WHERE email = ? AND role = 'teacher'",
            [teacher.email]
        );
        
        if (!Array.isArray(teacherRows) || teacherRows.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "Teacher not found" },
                { status: 404 }
            );
        }
        
        const teacherId = (teacherRows[0] as any).id;

        // Check if the teacher is assigned to this course
        const [courseCheck] = await connection.execute(`
            SELECT * FROM courses 
            WHERE id = ? AND teacher_id = ?
        `, [courseId, teacherId]);

        if (!Array.isArray(courseCheck) || courseCheck.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "You do not have access to this course" },
                { status: 403 }
            );
        }

        // Get enrollments with student details
        // This ensures only enrollments for this specific course are returned
        const [rows] = await connection.execute(`
            SELECT 
                e.id, 
                e.course_id, 
                e.student_id, 
                e.enrolled_at, 
                e.status as enrollment_status,
                u.full_name, 
                u.email, 
                u.status,
                DATE_FORMAT(e.enrolled_at, '%Y-%m-%d') as joined_date
            FROM 
                enrollments e
            JOIN 
                users u ON e.student_id = u.id
            WHERE 
                e.course_id = ?
            ORDER BY 
                u.full_name ASC
        `, [courseId]);

        console.log(`Found ${Array.isArray(rows) ? rows.length : 0} enrollments for course ${courseId}`);

        // Format the response to include student objects
        const enrollments = Array.isArray(rows) ? rows.map((row: any) => ({
            id: row.id,
            course_id: parseInt(row.course_id),  // Ensure course_id is an integer
            student_id: row.student_id,
            enrolled_at: row.enrolled_at,
            status: row.enrollment_status,
            student: {
                id: row.student_id,
                full_name: row.full_name,
                email: row.email,
                status: row.status,
                joined_date: row.joined_date
            }
        })) : [];

        await connection.end();

        return NextResponse.json({ enrollments });
    }
    catch (error){
        console.error("Error fetching course enrollments:", error);
        return NextResponse.json(
            { message: "Failed to fetch enrollments", error: String(error) },
            { status: 500 }
        );
    }
}