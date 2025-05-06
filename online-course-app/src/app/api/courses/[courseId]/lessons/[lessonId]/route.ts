import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

// Define interfaces for type safety
interface LessonRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  video_url: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface JwtUserPayload {
  userId: number;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  schoolId?: number;
}

// Define route params type
interface RouteParams {
  courseId: string;
  lessonId: string;
}

/**
 * Database Connection Helper
 */
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coursesite',
  });
}

/**
 * Authentication Helper - verifies JWT tokens
 */
function verifyToken(authorization: string | null) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.split(' ')[1];
  
  try {
    const secretKey = process.env.JWT_SECRET || '7f749666e7cba2f784b5bfe1c57f313557ce3ff3c74ed9637c56eeccef7e8af6de9cd800b2058fafc933bc1601b9c20249ed83e9783db020e20acf86a66badcd';
    return jwt.verify(token, secretKey) as JwtUserPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * GET handler for lesson details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // Get the dynamic parameters from the route
    const { courseId, lessonId } = await params;
    
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get database connection
    const connection = await getConnection();
    
    try {
      // Check course enrollment for non-admin users
      if (decoded.role !== 'admin') {
        const [enrollments] = await connection.execute(
          `SELECT id FROM enrollments 
           WHERE student_id = ? AND course_id = ? AND status = 'active'`,
          [decoded.userId, courseId]
        );

        if (!Array.isArray(enrollments) || enrollments.length === 0) {
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      }
      
      // Get lesson details
      const [lessons] = await connection.execute<LessonRow[]>(
        `SELECT l.id, l.title, l.content, l.video_url, l.position, l.created_at, l.updated_at
         FROM lessons l
         WHERE l.id = ? AND l.course_id = ?`,
        [lessonId, courseId]
      );

      if (!Array.isArray(lessons) || lessons.length === 0) {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        );
      }
      
      const lesson = lessons[0];

      // Check completion status
      const [progress] = await connection.execute<RowDataPacket[]>(
        `SELECT completed 
         FROM user_progress 
         WHERE user_id = ? AND lesson_id = ? AND course_id = ?`,
        [decoded.userId, lessonId, courseId]
      );

      const isCompleted = progress.length > 0 ? !!progress[0].completed : false;

      // Return lesson with completion status
      return NextResponse.json({
        ...lesson,
        completed: isCompleted
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error in lesson details API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}