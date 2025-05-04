import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket, OkPacket } from "mysql2"; // Import types from mysql2

// Define interfaces for database results
interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  start_date: string;
  end_date: string;
  status: string;
  difficulty_level: string | null;
  school_name: string | null;
  teacher_name: string | null;
}

interface LessonStats extends RowDataPacket {
  total_lessons: number;
  completed_lessons: number;
}

// Get a database connection
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coursesite',
  });
}

// Verify JWT token
function verifyToken(authorization: string | null) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.split(' ')[1];
  
  try {
    const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
    return jwt.verify(token, secretKey) as jwt.JwtPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// GET handler for course details
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const courseId = params.courseId;
    if (!courseId || isNaN(Number(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Establish database connection
    const connection = await getConnection();

    try {
      // First check if the student has access to this course
      const [enrollments] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM enrollments 
         WHERE student_id = ? AND course_id = ? AND status = 'active'`,
        [decoded.userId, courseId]
      );

      // If not enrolled and not an admin, deny access
      if ((!Array.isArray(enrollments) || enrollments.length === 0) && decoded.role !== 'admin') {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
      
      // Get basic course details
      const [courseRows] = await connection.execute<CourseRow[]>(
        `SELECT c.id, c.title, c.description, c.thumbnail, c.start_date, c.end_date, 
                c.status, c.difficulty_level, s.name as school_name,
                u.full_name as teacher_name
         FROM courses c
         LEFT JOIN schools s ON c.school_id = s.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [courseId]
      );

      if (!Array.isArray(courseRows) || courseRows.length === 0) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Get lesson count and completed lessons
      const [lessonStats] = await connection.execute<LessonStats[]>(
        `SELECT 
          (SELECT COUNT(*) FROM lessons WHERE course_id = ?) as total_lessons,
          (SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND course_id = ? AND completed = 1) as completed_lessons`,
        [courseId, decoded.userId, courseId]
      );

      // Get the first course row
      const courseData = courseRows[0];
      
      // Get stats with proper typing
      const stats = lessonStats[0] || { total_lessons: 0, completed_lessons: 0 };
      
      // Calculate progress percentage
      const totalLessons = stats.total_lessons || 0;
      const completedLessons = stats.completed_lessons || 0;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return NextResponse.json({
        ...courseData,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error in course API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}