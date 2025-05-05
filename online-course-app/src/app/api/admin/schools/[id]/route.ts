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

export async function GET(request: NextRequest, { params }: { params: { id: string } }){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const schoolId = params.id;

        const connection = await getConnection();

        const [rows] = await connection.execute(
            "SELECT * FROM schools WHERE status = 'active' ORDER BY name ASC",
            [schoolId]);

        await connection.end();

        if (!Array.isArray(rows) || rows.length === 0){
            return NextResponse.json(
                { message: "School not found"},
                { status: 404}
            );
        }

        interface SchoolRow {
            id: number;
            name: string;
            location: string;
            contact_email: string;
            contact_phone: string;
            access_code: string;
            status: 'active' | 'inactive';
          }
        const school = rows[0] as SchoolRow;

        return NextResponse.json({
            school
        });
    }
    catch (error) {
        console.error("Error fetching school:", error);
        return NextResponse.json(
            { message: "Failed to fetch school"},
            { status: 500}
        );
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const schoolId = params.id;

        const { name, location, contact_email, contact_phone, access_code, status } = await request.json();

        if (!name || !location || !contact_email){
            return NextResponse.json(
                { message:"Missing required fields"},
                { status: 400}
            );
        }

        const connection = await getConnection();

        const [existingSchools] = await connection.execute(
            "SELECT * FROM schools WHERE id = ?",
            [schoolId]
        );

        if (!Array.isArray(existingSchools) || existingSchools.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "School not found"},
                { status: 404}
            );
        }

        const [nameCheck] = await connection.execute(
            "SELECT * FROM schools WHERE name = ? AND id != ?",
            [name, schoolId]
        );

        if (Array.isArray(nameCheck) && nameCheck.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "School already exists"},
                { status: 409}
            );
        }

        if (access_code){
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
        }

        await connection.execute(
            `UPDATE schools SET
            name = ?,
            location = ?,
            contact_email = ?,
            contact_phone = ?,
            access_code = ?,
            status = ?,
            WHERE id = ?`,
            [name, location, contact_email, contact_phone || null, access_code, status || 'active', schoolId]
        );

        const [updatedRows] = await connection.execute(
            "SELECT * FROM schools WHERE id = ?",
            [schoolId]
        );

        await connection.end();

        //@ts-expect-error
        const updatedSchool = updatedRows[0];

        return NextResponse.json({
            message: "School updated successfully",
            school: updatedSchool
        });
    }
    catch (error) {
        console.error("Error updating school:", error);
        return NextResponse.json(
            { message: "Failed to update school"},
            { status: 500}
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const schoolId = params.id;

        const connection = await getConnection();

        const [existingSchools] = await connection.execute(
            "SELECT * FROM schools WHERE id = ?",
            [schoolId]
        );

        if (!Array.isArray(existingSchools) || existingSchools.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "School not found"},
                { status: 404}
            );
        }

        const [associatedUsers] = await connection.execute(
            "SELECT COUNT(*) as count FROM users WHERE school_id = ?",
            [schoolId]
        );

        //@ts-expect-error
        if (associatedUsers[0].count > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Users already assigned to this school"},
                { status: 409}
            );
        }

        const [associatedCourses] = await connection.execute(
            "SELECT COUNT(*) as count FROM courses WHERE school_id = ?",
            [schoolId]
        );

        // @ts-expect-error
        if (associatedCourses[0].count > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Courses already made for this school"},
                { status: 409}
            );
        }

        await connection.execute(
            "DELETE FROM schools WHERE id = ?",
            [schoolId]
        );

        await connection.end();

        return NextResponse.json({
            message: "School deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting school:", error);
        return NextResponse.json(
            { message: "Failed to delete school"},
            { status: 500}
        );
    }
}