import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest){
    try{
        const { email, password } = await request.json();
        if (!email || !password){
            return NextResponse.json(
                { message:"Missing required fields" },
                { status: 400}
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coursesite',
        });

        const [rows] = await connection.execute(
            `SELECT u.*, s.name as school_name, s.access_code as school_code
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.email = ?`,
            [email]
        );

        if (!Array.isArray(rows) || rows.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "Invalid credentials"},
                { status: 401}
            );
        }

        const user = rows[0] as any;

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid){
            await connection.end();
            return NextResponse.json(
                { message: "Invalid credentials"},
                { status: 401} 
            );
        }

        let dashboardPath;
        switch (user.role){
            case 'admin':
                dashboardPath = '/admin-dashboard';
                break;
            case 'teacher':
                dashboardPath = '/teacher-dashboard';
                break;
            default:
                dashboardPath = '/student-dashboard';
        }

        await connection.end();

        const schoolInfo = user.school_id ? {
            id: user.school_id,
            name: user.school_name,
            code: user.school_code
        } : null;

        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd'
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.full_name,
                schoolId: user.school_id
            },
            secretKey,
            { expiresIn: '1y'}
        );

        return NextResponse.json({ 
            message: "Login successfully",
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                school_id: user.school_id,
                school_name: user.school_name
            },
            school: schoolInfo,
            dashboardPath
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error"},
            { status: 500}
        );
    }
}