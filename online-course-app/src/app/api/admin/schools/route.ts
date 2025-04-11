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

const generateAccessCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = '';
    for (let i = 0; i < 6; i++){
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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

        const [rows] = await connection.execute(
            "SELECT * FROM schools ORDER BY name ASC"
        );

        await connection.end();

        return NextResponse.json({ schools: rows});
    }
    catch (error){
        console.error("Error fetching schools:", error);
        return NextResponse.json(
            { message: "Failed to fetch schools", error: String(error) },
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

        const { name, location, contact_email, contact_phone, status, access_code } = body;

        if (!name || !location || !contact_email){
            return NextResponse.json(
                { message:"Missing required fields"},
                { status: 400}
            );
        }

        const connection = await getConnection();

        const [existingSchools] = await connection.execute(
            "SELECT * FROM schools WHERE name = ?",
            [name]
        );

        if (Array.isArray(existingSchools) && existingSchools.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "School already registered"},
                { status: 409}
            );
        }

        const schoolAccessCode = access_code || generateAccessCode();

        const [codeCheck] = await connection.execute(
            "SELECT * FROM schools WHERE access_code = ?",
            [schoolAccessCode]
        );

        if (Array.isArray(codeCheck) && codeCheck.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Access code already in use"},
                { status: 409}
            );
        }

        const [result] = await connection.execute(
            "INSERT INTO schools (name, location, contact_email, contact_phone, access_code, status) VALUES (?,?,?,?,?,?)",
            [name, location, contact_email, contact_phone, schoolAccessCode, status || 'active']
        );

        await connection.end();

        // @ts-ignore
        const insertId = result.insertId;

        return NextResponse.json({
            message: "School created successfully",
            school: {
                id: insertId,
                name,
                location,
                contact_email,
                contact_phone,
                access_code: schoolAccessCode,
                status: status || 'active'
            }
        },
            { status: 201}
        );
    }
    catch (error) {
        console.error("Error creating school:", error);
        return NextResponse.json(
            { message: "Failed to create school"},
            { status: 500}
        );
    }
}