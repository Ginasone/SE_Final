import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

// Define interface for course rows
interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  school_id: number | null;
  school_name?: string;
  teacher_id: number | null;
  teacher_name?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'archived';
  student_count?: number;
  created_at: string;
}

interface JwtAdmin {
  userId: number;
  role: string;
  email: string;
  name: string;
}

interface CountQueryResult extends RowDataPacket {
  count: number;
}

// Verify admin token
const verifyAdminToken = async (request: Request) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : null;

    if (!token) {
        return null;
    }

    try {
        const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
        const decoded = jwt.verify(token, secretKey) as JwtAdmin;

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

// Database connection helper
const getConnection = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'coursesite',
    });
};

// GET handler - fetch a specific course
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await verifyAdminToken(request);
  if (!admin){
    return NextResponse.json(
      { message: "Unauthorized access"},
      { status: 401 }
    );
  }

  try {
    const courseId = id;

    const connection = await getConnection();

    const [rows] = await connection.execute<CourseRow[]>(
      `SELECT c.*,
          s.name as school_name,
          u.full_name as teacher_name,
          (SELECT COUNT(*) FROM enrollments ce WHERE ce.course_id = c.id) as student_count
      FROM courses c
      LEFT JOIN schools s ON c.school_id = s.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
      `, [courseId]);

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0){
      return NextResponse.json(
        { message: "Course not found"},
        { status: 404}
      );
    }

    const course = rows[0];

    return NextResponse.json({
      course
    });
  }
  catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { message: "Failed to fetch course"},
      { status: 500}
    );
  }
}

// PUT handler - update a course
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await verifyAdminToken(request);
  if (!admin){
    return NextResponse.json(
      { message: "Unauthorized access"},
      { status: 401 }
    );
  }

  try {
    const courseId = id;

    const body = await request.json();
    const { title, description, school_id, teacher_id, start_date, end_date, status } = body;

    if (!title){
      return NextResponse.json(
        { message: "Missing required fields"},
        { status: 400}
      );
    }

    const validStatuses = ['draft', 'published', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value"},
        { status: 400}
      );
    }

    if (status === 'published' && !school_id) {
      return NextResponse.json(
        { message: "School must be selected for published courses"},
        { status: 400}
      );
    }

    if (start_date && end_date){
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);

      if (endDateObj < startDateObj){
        return NextResponse.json(
          { message: "End date cannot be before start date"},
          { status: 400}
        );
      }
    }

    const connection = await getConnection();

    const [existingCourses] = await connection.execute<CourseRow[]>(
      "SELECT * FROM courses WHERE id = ?",
      [courseId]
    );

    if (!Array.isArray(existingCourses) || existingCourses.length === 0){
      await connection.end();
      return NextResponse.json(
        { message: "Course not found"},
        { status: 404}
      );
    }

    if (school_id){
      const [schoolCheck] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM schools WHERE id = ?",
        [school_id]
      );

      if (!Array.isArray(schoolCheck) || schoolCheck.length === 0){
        await connection.end();
        return NextResponse.json(
          { message: "School does not exist"},
          { status: 409}
        );
      }
    }

    if (teacher_id){
      const [teacherCheck] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE id = ? AND role = 'teacher'",
        [teacher_id]
      );

      if (!Array.isArray(teacherCheck) || teacherCheck.length === 0){
        await connection.end();
        return NextResponse.json(
          { message: "Teacher does not exist"},
          { status: 409}
        );
      }
    }

    if (school_id && teacher_id){
      const [teacherSchoolCheck] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE id = ? AND school_id = ?",
        [teacher_id, school_id]
      );

      if (!Array.isArray(teacherSchoolCheck) || teacherSchoolCheck.length === 0){
        await connection.end();
        return NextResponse.json(
          { message: "Teacher does not exist in the school"},
          { status: 409}
        );
      }
    }

    await connection.execute(
      `UPDATE courses SET
      title = ?,
      description = ?,
      school_id = ?,
      teacher_id = ?,
      start_date = ?,
      end_date = ?,
      status = ?,
      updated_at = NOW()
      WHERE id = ?`,
      [
        title,
        description || null,
        school_id || null,
        teacher_id || null,
        start_date || null,
        end_date || null,
        status || 'draft',
        courseId
      ]
    );

    const [updatedCourseRows] = await connection.execute<CourseRow[]>(`
      SELECT c.*,
          s.name as school_name,
          u.full_name as teacher_name,
          (SELECT COUNT(*) FROM enrollments ce WHERE ce.course_id = c.id) as student_count
      FROM courses c
      LEFT JOIN schools s ON c.school_id = s.id
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
      `, [courseId]);

    await connection.end();

    const updatedCourse = updatedCourseRows[0];

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse
    });
  }
  catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { message: "Failed to update course"},
      { status: 500}
    );
  }
}

// DELETE handler - delete a course
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await verifyAdminToken(request);
  if (!admin){
    return NextResponse.json(
      { message: "Unauthorized access"},
      { status: 401 }
    );
  }

  try {
    const courseId = id;

    const connection = await getConnection();

    const [existingCourses] = await connection.execute<CourseRow[]>(
      "SELECT * FROM courses WHERE id = ?",
      [courseId]
    );

    if (!Array.isArray(existingCourses) || existingCourses.length === 0){
      await connection.end();
      return NextResponse.json(
        { message: "Course not found"},
        { status: 404}
      );
    }

    const [enrollments] = await connection.execute<CountQueryResult[]>(
      "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?",
      [courseId]
    );

    if (enrollments[0].count > 0){
      await connection.end();
      return NextResponse.json(
        { message: "Students have already enrolled into the course. Archive instead"},
        { status: 409}
      );
    }

    await connection.execute(
      "DELETE FROM courses WHERE id = ?",
      [courseId]
    );

    await connection.end();

    return NextResponse.json({
      message: "Course deleted successfully",
    });
  }
  catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { message: "Failed to delete course"},
      { status: 500}
    );
  }
}