import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
        console.error("Error in operation:", error);
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
            SELECT u.*, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            ORDER BY u.full_name ASC
            `);

        await connection.end();

        return NextResponse.json({ users: rows});
    }
    catch (error){
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Failed to fetch users", error: String(error) },
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

        const { full_name, email, password, role, school_id, status } = body;

        if (!full_name || !email || !password || !role){
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

        const connection = await getConnection();

        const [existingUsers] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (Array.isArray(existingUsers) && existingUsers.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "User already registered"},
                { status: 409}
            );
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const [result] = await connection.execute(
            "INSERT INTO users (full_name, email, password_hash, role, school_id, status) VALUES (?,?,?,?,?,?)",
            [full_name, email, hashedPassword, role, school_id || null, status || 'active']
        );

        await connection.end();

        // @ts-expect-error - MySQL insert result lacks proper TypeScript type definition for insertId
        const insertId = result.insertId;

        return NextResponse.json({
            message: "User created successfully",
            user: {
                id: insertId,
                full_name,
                email,
                role,
                school_id,
                status: status || 'active'
            }
        },
            { status: 201}
        );
    }
    catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { message: "Failed to create user"},
            { status: 500}
        );
    }
}