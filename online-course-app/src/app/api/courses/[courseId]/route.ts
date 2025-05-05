// File: src/app/api/courses/[courseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

// Define types for our database results
interface CourseRow {
  id: number;
  title: string;
  description: string;
  school_id: number | null;
  teacher_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  school_name: string | null;
  teacher_name: string | null;
  student_count?: number;
}

interface LessonRow {
  id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
}

interface UserJwtPayload extends jwt.JwtPayload {
  id?: number;
  role?: string;
  school_id?: number;
}

// Verify the user's JWT token
const verifyToken = async (request: NextRequest) => {
    // Check for token in both cookie and authorization header
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        console.log("No token found in request");
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as UserJwtPayload;
        console.log("Token decoded successfully:", decoded?.id, decoded?.role);
        return decoded;
    }
    catch (error) {
        console.error("Token verification error:", error);
        return null;
    }
};

// Create a database connection
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
    { params }: { params: { courseId: string } }
) {
    console.log("API request received for course:", params.courseId);
    
    // Step 1: Get the course ID from the URL parameters
    const courseId = params.courseId;
    if (!courseId) {
        console.log("Missing course ID");
        return NextResponse.json(
            { message: "Course ID is required" },
            { status: 400 }
        );
    }

    // Step 2: Verify the user is authenticated
    const userPayload = await verifyToken(request);
    if (!userPayload) {
        console.log("Unauthorized access attempt");
        return NextResponse.json(
            { message: "Unauthorized access" },
            { status: 401 }
        );
    }

    // Create safe user object with null fallbacks for all properties
    const user = {
        id: userPayload.id ?? null,
        role: userPayload.role ?? 'student',
        school_id: userPayload.school_id ?? null
    };
    
    console.log("User data:", user);

    let connection;
    try {
        connection = await getConnection();
        
        // Step 3: Fetch the course details first
        const [courseRows] = await connection.execute<mysql.RowDataPacket[]>(
            `SELECT c.*,
                s.name as school_name,
                u.full_name as teacher_name
            FROM courses c
            LEFT JOIN schools s ON c.school_id = s.id
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?`,
            [courseId]
        );
        
        // Check if the course exists
        if (!Array.isArray(courseRows) || courseRows.length === 0) {
            console.log("Course not found");
            await connection.end();
            return NextResponse.json(
                { message: "Course not found" },
                { status: 404 }
            );
        }
        
        // Cast the row to our CourseRow type
        const course = courseRows[0] as unknown as CourseRow;
        
        // Step 4: Check access permissions based on user role
        if (user.role === 'student' && user.id !== null) {
            // For students, check enrollment - only if we have a valid user ID
            const [enrollments] = await connection.execute<mysql.RowDataPacket[]>(
                `SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?`,
                [user.id, courseId]
            );
            
            const isEnrolled = Array.isArray(enrollments) && enrollments.length > 0;
            console.log("Student enrollment check:", isEnrolled ? "Enrolled" : "Not enrolled");
            
            // If not enrolled and course is not published at student's school, deny access
            if (!isEnrolled && !(course.status === 'published' && course.school_id === user.school_id)) {
                console.log("Student access denied - not enrolled and course not published at their school");
                await connection.end();
                return NextResponse.json(
                    { message: "You need to enroll in this course to access it" },
                    { status: 403 }
                );
            }
        } else if (user.role === 'teacher' && user.id !== null) {
            // Teacher can only access courses they teach or at their school
            const isTeachersCourse = course.teacher_id === user.id;
            const isTeachersSchool = course.school_id === user.school_id;
            
            if (!isTeachersCourse && !isTeachersSchool) {
                console.log("Teacher access denied - not teaching this course and not at their school");
                await connection.end();
                return NextResponse.json(
                    { message: "You don't have access to this course" },
                    { status: 403 }
                );
            }
        }
        // Admins have access to all courses, so no additional checks needed
        
        // Step 5: Fetch lessons for the course
        console.log("Fetching lessons for course:", courseId);
        const [lessons] = await connection.execute<mysql.RowDataPacket[]>(`
            SELECT id, title, content, video_url, position
            FROM lessons
            WHERE course_id = ?
            ORDER BY position ASC
        `, [courseId]);
        
        console.log(`Found ${Array.isArray(lessons) ? lessons.length : 0} lessons`);
        
        // Step 6: Return the course with its lessons
        const response = {
            ...course,
            lessons: lessons as unknown as LessonRow[]
        };
        
        await connection.end();
        return NextResponse.json(response);
    }
    catch (error) {
        console.error("Error fetching course:", error);
        if (connection) await connection.end();
        return NextResponse.json(
            { message: "Failed to fetch course", error: String(error) },
            { status: 500 }
        );
    }
}