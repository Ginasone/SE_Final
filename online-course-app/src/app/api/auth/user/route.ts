// src/app/api/auth/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

export async function GET(request: NextRequest) {
    try {
        // Extract token from Authorization header
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: "Unauthorized - Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        
        try {
            const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;

            if (!decoded || !decoded.userId) {
                return NextResponse.json(
                    { message: "Invalid token - Missing user ID" },
                    { status: 401 }
                );
            }

            // Database connection
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'coursesite',
            });

            // Fetch user from database
            const [users] = await connection.execute(
                `SELECT u.id, u.full_name, u.email, u.role, u.profile_picture, u.school_id, s.name as school_name
                FROM users u
                LEFT JOIN schools s ON u.school_id = s.id
                WHERE u.id = ?`,
                [decoded.userId]
            );

            await connection.end();

            // Check if user exists
            if (!Array.isArray(users) || users.length === 0) {
                return NextResponse.json(
                    { message: "User not found" },
                    { status: 404 }
                );
            }

            // Return user data
            const user = users[0];
            console.log("User data retrieved:", user);
            
            return NextResponse.json(user);
        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            
            if (jwtError instanceof jwt.TokenExpiredError) {
                return NextResponse.json(
                    { message: "Token expired" },
                    { status: 401 }
                );
            }
            
            if (jwtError instanceof jwt.JsonWebTokenError) {
                return NextResponse.json(
                    { message: "Invalid token" },
                    { status: 401 }
                );
            }
            
            throw jwtError; // Re-throw for general error handling
        }
    } catch (error) {
        console.error("Auth endpoint error:", error);

        return NextResponse.json(
            { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
