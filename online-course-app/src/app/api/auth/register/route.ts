import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

export async function POST(request: NextRequest){
    try{
        const {full_name, email, password, role, admin_code, school_code} = await request.json();

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

        let roleValue =  'student' ;
        let schoolId = null;

        if (role === 'admin'){
            if (!admin_code || admin_code !== process.env.ADMIN_REGISTRATION_CODE){
                await connection.end();
                return NextResponse.json(
                    { message: "Invalid admin registration code"},
                    { status: 403}
                );
            }
            roleValue = 'admin';
        }
        else {
            if (!school_code){
                await connection.end();
                return NextResponse.json(
                    { message: "School code is required for registration"},
                    { status: 400}
                );
            }

            const [schools] = await connection.execute(
                "SELECT * FROM schools WHERE access_code = ? AND status = 'active'",
                [school_code]
            );
    
            if (!Array.isArray(schools) || schools.length === 0) {
                await connection.end();
                return NextResponse.json(
                    { message: "Invalid or inactive school code"},
                    { status: 403}
                );
            }

            interface School {
                id: number;
                name: string;
                location: string;
                contact_email: string;
                contact_phone: string;
                access_code: string;
                status: 'active' | 'inactive';
            }

            schoolId = (schools[0] as School).id;
            roleValue = role === 'teacher' ? 'teacher' : 'student';
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const [result] = await connection.execute(
            "INSERT INTO users (full_name, email, password_hash, role, school_id, created_at) VALUES (?,?,?,?,?, NOW())",
            [full_name, email, hashedPassword, roleValue, schoolId]
        );

        interface School {
            id: number;
            name: string;
            location: string;
            contact_email: string;
            contact_phone: string;
            access_code: string;
            status: 'active' | 'inactive';
        }
        let schoolInfo = null;
        if (schoolInfo) {
            const [schoolResults] = await connection.execute(
                "SELECT name FROM schools WHERE id = ?",
                [schoolId]
            );

            if (Array.isArray(schoolResults) && schoolResults.length > 0){
                schoolInfo = {
                    id: schoolId,
                    name: (schoolResults[0] as School).name 
                };
            }
        }

        await connection.end();

        // @ts-expect-error - MySQL insert result doesn't have proper TypeScript type definition for insertId
        const userId = result.insertId;

        return NextResponse.json({
            message: "User registered successfully",
            user: {
                id: userId,
                full_name,
                email,
                role: roleValue,
                school: schoolInfo
            }
        },
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