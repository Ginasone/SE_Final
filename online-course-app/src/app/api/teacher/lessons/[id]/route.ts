import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket} from "mysql2";

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

// PUT: Update a lesson
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Fixed: Access params via context
    const { params } = context;
    const { id } = await params;
    const lessonId = id;
    
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

        // Check if the lesson exists and belongs to a course taught by this teacher
        const [lessonCheck] = await connection.execute<Lesson[]>(`
            SELECT l.* 
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = ? AND c.teacher_id = ?
        `, [lessonId, teacherId]);

        if (!Array.isArray(lessonCheck) || lessonCheck.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "Lesson not found or you do not have access to it" },
                { status: 404 }
            );
        }

        // Update the lesson
        await connection.execute(`
            UPDATE lessons 
            SET title = ?, content = ?, video_url = ?, position = ?
            WHERE id = ?
        `, [
            body.title,
            body.content,
            body.video_url || null,
            body.position || 1,
            lessonId
        ]);

        // Fetch the updated lesson
        const [updatedRows] = await connection.execute<Lesson[]>(`
            SELECT * FROM lessons WHERE id = ?
        `, [lessonId]);

        await connection.end();

        return NextResponse.json({
            message: "Lesson updated successfully",
            lesson: updatedRows[0]
        });
    }
    catch (error){
        console.error("Error updating lesson:", error);
        return NextResponse.json(
            { message: "Failed to update lesson", error: String(error) },
            { status: 500 }
        );
    }
}

// DELETE: Delete a lesson
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Fixed: Access params via context
    const { params } = context;
    const { id } = await params;
    const lessonId = id;
    
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

        // Check if the lesson exists and belongs to a course taught by this teacher
        const [lessonCheck] = await connection.execute<Lesson[]>(`
            SELECT l.* 
            FROM lessons l
            JOIN courses c ON l.course_id = c.id
            WHERE l.id = ? AND c.teacher_id = ?
        `, [lessonId, teacherId]);

        if (!Array.isArray(lessonCheck) || lessonCheck.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "Lesson not found or you do not have access to it" },
                { status: 404 }
            );
        }

        // Delete the lesson
        await connection.execute(`
            DELETE FROM lessons WHERE id = ?
        `, [lessonId]);

        await connection.end();

        return NextResponse.json({
            message: "Lesson deleted successfully"
        });
    }
    catch (error){
        console.error("Error deleting lesson:", error);
        return NextResponse.json(
            { message: "Failed to delete lesson", error: String(error) },
            { status: 500 }
        );
    }
}