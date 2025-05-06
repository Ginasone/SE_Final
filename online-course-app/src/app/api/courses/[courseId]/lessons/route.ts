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

// GET lessons for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise< { courseId: string } > }
) {
    const { courseId } = await params;
    // Validate user authentication
    const user = await verifyToken(request);
    if (!user) {
        return NextResponse.json(
            { message: "Unauthorized access" },
            { status: 401 }
        );
    }

    // Validate courseId parameter
    if (!courseId || isNaN(Number(courseId))) {
        console.log("Invalid courseId:", courseId);
        return NextResponse.json(
            { message: "Invalid course ID" },
            { status: 400 }
        );
    }

    try {
        const connection = await getConnection();

        // Define interface for lesson row
        interface LessonRow {
            id: number;
            title: string;
            content: string | null;
            video_url: string | null;
            position: number;
            created_at: string;
            updated_at: string;
        }

        // Get lessons for this course
        const [lessonRows] = await connection.execute(`
            SELECT id, title, content, video_url, position, created_at, updated_at
            FROM lessons
            WHERE course_id = ?
            ORDER BY position ASC
        `, [courseId]);

        await connection.end();

        // Format response with proper typing
        const lessons = Array.isArray(lessonRows) ? (lessonRows as LessonRow[]) : [];

        return NextResponse.json({ lessons });
    }
    catch (error) {
        console.error("Error fetching lessons:", error);
        return NextResponse.json(
            { message: "Failed to fetch lessons", error: String(error) },
            { status: 500 }
        );
    }
}

// POST a new lesson
export async function POST(
    request: NextRequest,
    { params }: { params: Promise< { courseId: string } > }
) {
    const { courseId } = await params;
    // Validate user authentication
    const user = await verifyToken(request);
    if (!user) {
        return NextResponse.json(
            { message: "Unauthorized access" },
            { status: 401 }
        );
    }

    // Verify user is a teacher
    if (user.role !== 'teacher' && user.role !== 'admin') {
        return NextResponse.json(
            { message: "Only teachers and admins can create lessons" },
            { status: 403 }
        );
    }

    // Validate courseId parameter
    if (!courseId || isNaN(Number(courseId))) {
        console.log("Invalid courseId:", courseId);
        return NextResponse.json(
            { message: "Invalid course ID" },
            { status: 400 }
        );
    }

    try {
        // Parse request body
        const body = await request.json();
        const { title, content, video_url, position } = body;

        // Validate required fields
        if (!title) {
            return NextResponse.json(
                { message: "Lesson title is required" },
                { status: 400 }
            );
        }

        // Either content or video_url should be provided
        if (!content && !video_url) {
            return NextResponse.json(
                { message: "Either content or video URL is required" },
                { status: 400 }
            );
        }

        const connection = await getConnection();

        // Check if course exists and teacher has access to it
        interface CourseRow {
            id: number;
            teacher_id: number | null;
        }

        const [courseRows] = await connection.execute(`
            SELECT id, teacher_id
            FROM courses
            WHERE id = ?
        `, [courseId]);

        if (!Array.isArray(courseRows) || courseRows.length === 0) {
            await connection.end();
            return NextResponse.json(
                { message: "Course not found" },
                { status: 404 }
            );
        }

        const course = (courseRows as CourseRow[])[0];

        // Verify teacher owns this course or user is admin
        if (user.role === 'teacher' && course.teacher_id !== user.id) {
            await connection.end();
            return NextResponse.json(
                { message: "You do not have permission to add lessons to this course" },
                { status: 403 }
            );
        }

        // Insert the new lesson
        const [result] = await connection.execute(`
            INSERT INTO lessons (course_id, title, content, video_url, position, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            courseId,
            title,
            content || null,
            video_url || null,
            position || 1
        ]);

        interface ResultWithId {
            insertId: number;
        }

        const insertId = (result as ResultWithId).insertId;

        // Get the created lesson
        const [newLessonRows] = await connection.execute(`
            SELECT id, title, content, video_url, position, created_at, updated_at
            FROM lessons
            WHERE id = ?
        `, [insertId]);

        interface LessonRow {
            id: number;
            title: string;
            content: string | null;
            video_url: string | null;
            position: number;
            created_at: string;
            updated_at: string;
        }

        await connection.end();

        return NextResponse.json({
            message: "Lesson created successfully",
            lesson: Array.isArray(newLessonRows) ? (newLessonRows as LessonRow[])[0] : null
        }, { status: 201 });
    }
    catch (error) {
        console.error("Error creating lesson:", error);
        return NextResponse.json(
            { message: "Failed to create lesson", error: String(error) },
            { status: 500 }
        );
    }
}