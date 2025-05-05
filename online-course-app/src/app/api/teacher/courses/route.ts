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

        // Fetch courses with accurate student counts using a subquery
        // This ensures the student count is accurate for each course
        const [rows] = await connection.execute(`
            SELECT 
                c.*,
                s.name as school_name,
                (
                    SELECT COUNT(*) 
                    FROM enrollments ce 
                    WHERE ce.course_id = c.id
                ) as student_count
            FROM 
                courses c
            LEFT JOIN 
                schools s ON c.school_id = s.id
            WHERE 
                c.teacher_id = ? 
            AND 
                c.status IN ('published', 'draft')
            ORDER BY 
                c.created_at DESC
        `, [teacherId]);

        // Log the courses found for debugging
        console.log(`Found ${Array.isArray(rows) ? rows.length : 0} courses for teacher ID ${teacherId}`);
        
        // Format each course to ensure course_id is properly set
        const courses = Array.isArray(rows) ? rows.map((course: any) => ({
            ...course,
            id: parseInt(course.id),  // Ensure ID is an integer
            student_count: parseInt(course.student_count || 0)  // Ensure count is an integer
        })) : [];

        await connection.end();

        return NextResponse.json({ courses });
    }
    catch (error){
        console.error("Error fetching teacher courses:", error);
        return NextResponse.json(
            { message: "Failed to fetch courses", error: String(error) },
            { status: 500 }
        );
    }
}