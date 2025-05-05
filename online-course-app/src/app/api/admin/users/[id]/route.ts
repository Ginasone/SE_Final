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

export async function GET(request: NextRequest, { params }: { params: { id: string } }){
    const admin = await verifyAdminToken(request);
    if (!admin){
        return NextResponse.json(
            { message: "Unauthorized access"},
            { status: 401 }
        );
    }

    try {
        const userId = params.id;

        const connection = await getConnection();

        const [rows] = await connection.execute(
            `SELECT u.*, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.id = ?
            `, [userId]);

        await connection.end();

        if (!Array.isArray(rows) || rows.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "User not found"},
                { status: 404}
            );
        }

        interface UserRow {
            id: number;
            full_name: string;
            email: string;
            role: 'student' | 'teacher' | 'admin';
            school_id: number | null;
            school_name?: string;
            status: 'active' | 'inactive';
            created_at: string;
          }
        const user = rows[0] as UserRow;

        //@ts-expect-error - MySQL result doesn't match TypeScript type but structure is known
        delete user.password_hash;

        return NextResponse.json({
            user
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Failed to fetch user"},
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
        const userId = params.id;

        const { full_name, email, password, role, school_id, status } = await request.json();

        if (!full_name || !email || !role){
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

        const connection = await getConnection();

        const [existingUsers] = await connection.execute(
            "SELECT * FROM users WHERE id = ?",
            [userId]
        );

        if (!Array.isArray(existingUsers) || existingUsers.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "User not found"},
                { status: 404}
            );
        }

        const [emailCheck] = await connection.execute(
            "SELECT * FROM users WHERE email = ? AND id != ?",
            [email, userId]
        );

        if (Array.isArray(emailCheck) && emailCheck.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "Email already in use"},
                { status: 409}
            );
        }

        let updateQuery;
        let updateParams;

        if (password){
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            updateQuery = `
                UPDATE users
                SET full_name = ?, email = ?, password_hash = ?, role = ?, school_id = ?, status = ?
                WHERE id = ?
            `;
            updateParams = [full_name, email, passwordHash, role, school_id || null, status || 'active', userId];
        }
        else{
            updateQuery = `
                UPDATE users
                SET full_name = ?, email = ?, role = ?, school_id = ?, status = ?
                WHERE id = ?
            `;
            updateParams = [full_name, email, role, school_id || null, status || 'active', userId];
        }

        await connection.execute(updateQuery, updateParams);

        const [updated] = await connection.execute(`
            SELECT u.*, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON u.school_id = s.id
            WHERE u.id = ?
            `, [userId]);

        await connection.end();

        //@ts-expect-error - MySQL query result type lacks proper definition but structure is known
        const updatedUser = updated[0];

        delete updatedUser.password_hash;

        return NextResponse.json({
            message: "User updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { message: "Failed to update user"},
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
        const userId = params.id;

        const connection = await getConnection();

        const [existingUsers] = await connection.execute(
            "SELECT * FROM users WHERE id = ?",
            [userId]
        );

        if (!Array.isArray(existingUsers) || existingUsers.length === 0){
            await connection.end();
            return NextResponse.json(
                { message: "User not found"},
                { status: 404}
            );
        }

        const [assignedCourses] = await connection.execute(
            "SELECT * FROM courses WHERE teacher_id = ?",
            [userId]
        );

        if (Array.isArray(assignedCourses) && assignedCourses.length > 0){
            await connection.end();
            return NextResponse.json(
                { message: "User already assigned to a course"},
                { status: 409}
            );
        }

        await connection.execute(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        await connection.end();

        return NextResponse.json({
            message: "User deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { message: "Failed to delete user"},
            { status: 500}
        );
    }
}