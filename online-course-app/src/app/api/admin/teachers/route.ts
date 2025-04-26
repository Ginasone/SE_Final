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
            SELECT u.id, u.full_name, u.email, u.role, u.school_id, u.status, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.role = 'teacher' AND u.status = 'active'
            ORDER BY u.full_name ASC
            `);

        await connection.end();

        return NextResponse.json({ teachers: rows});
    }
    catch (error){
        console.error("Error fetching teachers:", error);
        return NextResponse.json(
            { message: "Failed to fetch teachers", error: String(error) },
            { status: 500 }
        );
    }
}
