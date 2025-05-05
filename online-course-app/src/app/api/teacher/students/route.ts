import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

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

// Define type for student
interface Student extends RowDataPacket {
    id: number;
    full_name: string;
    email: string;
    status: string;
    enrollment_date: string;
    course_title: string;
    course_id: number;
    school_name: string;
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

export async function GET(request: NextRequest) {
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

        // Get all students enrolled in courses taught by this teacher
        const [rows] = await connection.execute<Student[]>(`
            SELECT DISTINCT 
                u.id, 
                u.full_name, 
                u.email, 
                u.status,
                e.enrollment_date,
                c.title as course_title,
                c.id as course_id,
                s.name as school_name
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            JOIN schools s ON u.school_id = s.id
            WHERE c.teacher_id = ? AND u.role = 'student'
            ORDER BY u.full_name ASC
        `, [teacherId]);

        await connection.end();

        return NextResponse.json({ students: rows });
    }
    catch (error){
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { message: "Failed to fetch students", error: String(error) },
            { status: 500 }
        );
    }
}