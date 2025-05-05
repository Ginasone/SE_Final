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
        const decoded = jwt.verify(token, secretKey) as { role: string};

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const schoolId = params.id;

        const { access_code } = await request.json();

        if (!access_code || access_code.length < 6){
            return NextResponse.json(
                { message:"Access code must be at least 6 characters" },
                { status: 400}
            );
        }

        const connection = await getConnection();

        const [existingSchools] = await connection.execute(
            "SELECT * FROM schools WHERE id = ?",
            [schoolId]
        );

        if (Array.isArray(existingSchools) && existingSchools.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "School not found"},
                { status: 404}
            );
        }

        const [codeCheck] = await connection.execute(
            "SELECT * FROM schools WHERE access_code = ? AND id != ?",
            [access_code, schoolId]
        );

        if (Array.isArray(codeCheck) && codeCheck.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Access code already in use"},
                { status: 409}
            );
        }

        await connection.execute(
            "UPDATE schools SET access_code = ? WHERE id = ?",
            [access_code, schoolId]
        );

        await connection.end();

        return NextResponse.json({
            message: "Access code created successfully",
            school_id: parseInt(schoolId),
            access_code: access_code 
        });
    }
    catch (error) {
        console.error("Error creating code:", error);
        return NextResponse.json(
            { message: "Failed to generate school"},
            { status: 500}
        );
    }
}