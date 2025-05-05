import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Define proper types for JWT payload
interface TeacherJwtPayload {
    userId: number;
    email: string;
    role: string;
    name: string;
    schoolId?: number;
}

// Define type for teacher row
interface TeacherRow extends RowDataPacket {
    id: number;
}

// Define type for course check
interface CourseRow extends RowDataPacket {
    id: number;
    teacher_id: number;
}

// Define type for lesson
interface Lesson extends RowDataPacket {
    id: number;
    course_id: number;
    title: string;
    content: string | null;
    video_url: string | null;
    position: number;
    created_at: string;
    updated_at: string;
}

// Define type for insert result
interface InsertResult extends ResultSetHeader {
    insertId: number;
}

const verifyTeacherToken = async (request: NextRequest) => {
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as TeacherJwtPayload;

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

// GET: Fetch all lessons for a course
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
        const [teacherRows] = await connection.execute<TeacherRow[]>(
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
        
        const teacherId = teacherRows[0].id;

        // Check if the teacher is assigned to this course
        const [courseCheck] = await connection.execute<CourseRow[]>(`
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

        // Get lessons for the course
        const [rows] = await connection.execute<Lesson[]>(`
            SELECT * FROM lessons
            WHERE course_id = ?
            ORDER BY position ASC
        `, [courseId]);

        await connection.end();

        return NextResponse.json({ lessons: rows });
    }
    catch (error){
        console.error("Error fetching course lessons:", error);
        return NextResponse.json(
            { message: "Failed to fetch lessons", error: String(error) },
            { status: 500 }
        );
    }
}

// POST: Create a new lesson
export async function POST(
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
        const body = await request.json();
        
        // Validate required fields
        if (!body.title || !body.content) {
            return NextResponse.json(
                { message: "Title and content are required" },
                { status: 400 }
            );
        }
        
        // Fetch the teacher ID from the database using the email in the token
        if (!teacher.email) {
            return NextResponse.json(
                { message: "Teacher email not found in token" },
                { status: 400 }
            );
        }
        
        const connection = await getConnection();
        
        // Get the teacher's ID from the database
        const [teacherRows] = await connection.execute<TeacherRow[]>(
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
        
        const teacherId = teacherRows[0].id;

        // Check if the teacher is assigned to this course
        const [courseCheck] = await connection.execute<CourseRow[]>(`
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

        // Insert the new lesson
        const [result] = await connection.execute<InsertResult>(`
            INSERT INTO lessons (course_id, title, content, video_url, position, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [
            courseId,
            body.title,
            body.content,
            body.video_url || null,
            body.position || 1
        ]);

        // Fetch the newly created lesson
        const [lessonRows] = await connection.execute<Lesson[]>(`
            SELECT * FROM lessons WHERE id = ?
        `, [result.insertId]);

        await connection.end();

        return NextResponse.json({
            message: "Lesson created successfully",
            lesson: lessonRows[0]
        }, { status: 201 });
    }
    catch (error){
        console.error("Error creating lesson:", error);
        return NextResponse.json(
            { message: "Failed to create lesson", error: String(error) },
            { status: 500 }
        );
    }
}