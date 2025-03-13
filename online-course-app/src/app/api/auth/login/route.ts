import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest){
    try{
        const {email, password, } = await request.json();
        if (!email || !password){
            return NextResponse.json(
                { message:"Missing required fields"},
                { status: 400}
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coursesite',
        });

        const [users] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        await connection.end();

        if (!Array.isArray(users) || users.length === 0){
            return NextResponse.json(
                { message: "Invalid credentials"},
                { status: 401}
            );
        }

        const user = users[0] as any;

        const isPasswordValid = await bcrypt.compare(password,user.password_hash);

        if (!isPasswordValid){
            return NextResponse.json(
                { message: "Invalid credentials"},
                { status: 201} 
            )
        }

        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd'
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
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
            },
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