import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const verifyAdminToken = async (request: NextRequest) => {
    const token = request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;

        if (decoded.role !== 'admin'){
            return null;
        }

        return decoded;
    }
    catch (error) {
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
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const connection = await getConnection();

        const [rows] = await connection.execute(`
            SELECT c.*,
                s.name as school_name,
                u.full_name as teacher_name,
                (SELECT COUNT(*) FROM enrollments ce WHERE ce.course_id = c.id) as student_count
            FROM courses c
            LEFT JOIN schools s ON c.school_id = s.id
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.created_at DESC
            `);

        await connection.end();

        return NextResponse.json({ courses: rows});
    }
    catch (error){
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { message: "Failed to fetch courses", error: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        console.log("Received body:", body);

        const { title, description, school_id, teacher_id, start_date, end_date, status } = body;

        if (!title){
            return NextResponse.json(
                { message:"Missing required fields"},
                { status: 400}
            );
        }

        const validStatuses = ['draft', 'published', 'archived'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "Invalid status value"},
                { status: 400}
            );
        }

        if (status === 'published' && !school_id) {
            return NextResponse.json(
                { message: "School must be selected for published courses"},
                { status: 400}
            );
        }

        if (start_date && end_date){
            const startDateObj = new Date(start_date);
            const endDateObj = new Date(end_date);

            if (endDateObj < startDateObj){
                return NextResponse.json(
                    { message: "End date cannot be before start date"},
                    { status: 400}
                );
            }
        }

        const connection = await getConnection();

        if (school_id){
            const [schoolCheck] = await connection.execute(
                "SELECT * FROM schools WHERE id = ?",
                [school_id]
            );
    
            if (!Array.isArray(schoolCheck) || schoolCheck.length === 0){
                await connection.end();
                return NextResponse.json(
                    { message: "School does not exist"},
                    { status: 409}
                );
            }
        }

        if (teacher_id){
            const [teacherCheck] = await connection.execute(
                "SELECT * FROM users WHERE id = ? AND role = 'teacher'",
                [teacher_id]
            );
    
            if (!Array.isArray(teacherCheck) || teacherCheck.length === 0){
                await connection.end();
                return NextResponse.json(
                    { message: "Teacher does not exist"},
                    { status: 409}
                );
            }
        }

        if (school_id){
            const [teacherSchoolCheck] = await connection.execute(
                "SELECT * FROM users WHERE id = ? AND school_id = ?",
                [teacher_id, school_id]
            );
    
            if (!Array.isArray(teacherSchoolCheck) || teacherSchoolCheck.length === 0){
                await connection.end();
                return NextResponse.json(
                    { message: "Teacher does not exist in the school"},
                    { status: 409}
                );
            }
        }

        const [result] = await connection.execute(
            `INSERT INTO courses (title, description, school_id, teacher_id, start_date, end_date, status, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
            [
                title,
                description || null,
                school_id || null,
                teacher_id || null,
                start_date || null,
                end_date || null,
                status || 'draft'
            ]
        );

        // @ts-ignore
        const courseId = result.insertId;

        const [newCourseRows] = await connection.execute(`
            SELECT c.*,
                s.name as school_name,
                u.full_name as teacher_name
            FROM courses c
            LEFT JOIN schools s ON c.school_id = s.id
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE c.id = ?
            `, [courseId]);

        await connection.end();

        // @ts-ignore
        const newCourse = newCourseRows[0];

        return NextResponse.json({
            message: "User created successfully",
            course: newCourse
        },
            { status: 201}
        );
    }
    catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json(
            { message: "Failed to create course"},
            { status: 500}
        );
    }
}