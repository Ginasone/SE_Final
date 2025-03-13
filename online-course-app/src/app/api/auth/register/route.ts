import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

export async function POST(request: NextRequest){
    try{
        const {full_name, email, password, role} = await request.json();
        if (!full_name || !email || !password){
            return NextResponse.json(
                { message:"Missing required fields"},
                { status: 400}
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format"},
                { status: 400}
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters long"},
                { status: 400}
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coursesite',
        });

        const [existingUsers] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Email already registered"},
                { status: 409}
            );
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const roleValue = role === 'teacher' ? '2' : '1';

        const [result] = await connection.execute(
            "INSERT INTO users (full_name, email, password_hash, role, created_at) VALUES (?,?,?,?, NOW())",
            [full_name, email, hashedPassword, roleValue]
        );

        await connection.end();

        return NextResponse.json(
            { message: "User registered successfully"},
            { status: 201}
        );
    }
    catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error"},
            { status: 500}
        );
    }
}