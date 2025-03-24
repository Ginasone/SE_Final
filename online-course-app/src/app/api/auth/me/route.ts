import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
    try{
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: "Unauthorized"},
                { status: 401}
            );
        }

        const token = authHeader.split(' ')[1];

        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;

        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { message:"Invalid token"},
                { status: 401}
            );
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coursesite',
        });

        const [users] = await connection.execute(
            "SELECT id, full_name, email, role, profile_picture, created_at FROM users WHERE id= ?",
            [decoded.userId]
        );

        await connection.end();

        if (!Array.isArray(users) || users.length === 0) {
            return NextResponse.json(
                { message: "User not found"},
                { status: 404}
            );
        }

        const user = users[0];

        return NextResponse.json(user);
    }
    catch (error) {
        console.error("Auth error:", error);

        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json(
                { message: "Invalid token"},
                { status: 401}
            );
        }

        return NextResponse.json(
            { message: "Internal server error"},
            { status: 500}
        );
    }
}