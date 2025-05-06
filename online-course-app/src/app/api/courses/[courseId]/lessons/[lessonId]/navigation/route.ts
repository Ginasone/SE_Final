import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

// Define interfaces for type safety
interface NavigationResult {
  prevLessonId: number | null;
  nextLessonId: number | null;
}

interface LessonPosition extends RowDataPacket {
  position: number;
}

interface LessonId extends RowDataPacket {
  id: number;
}

interface JwtPayload {
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
    return jwt.verify(token, secretKey) as JwtPayload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * GET handler for lesson navigation
 * 
 * ENDPOINT: /api/courses/{courseId}/lessons/{lessonId}/navigation
 * PURPOSE: Get previous and next lesson IDs for navigation
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
    
    // Check if user has access to this course (unless admin)
    const connection = await getConnection();
    
    try {
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
      
      // Get current lesson position
      const [currentLessonResult] = await connection.execute<LessonPosition[]>(
        `SELECT position FROM lessons WHERE id = ? AND course_id = ?`,
        [lessonId, courseId]
      );

      if (!Array.isArray(currentLessonResult) || currentLessonResult.length === 0) {
        return NextResponse.json(
          { error: 'Lesson not found in this course' },
          { status: 404 }
        );
      }

      const currentPosition = currentLessonResult[0].position;

      // Get previous lesson
      const [prevLessonResult] = await connection.execute<LessonId[]>(
        `SELECT id FROM lessons 
         WHERE course_id = ? AND position < ? 
         ORDER BY position DESC 
         LIMIT 1`,
        [courseId, currentPosition]
      );

      // Get next lesson
      const [nextLessonResult] = await connection.execute<LessonId[]>(
        `SELECT id FROM lessons 
         WHERE course_id = ? AND position > ? 
         ORDER BY position ASC 
         LIMIT 1`,
        [courseId, currentPosition]
      );

      const prevLessons = prevLessonResult;
      const nextLessons = nextLessonResult;

      return NextResponse.json({
        prevLessonId: Array.isArray(prevLessons) && prevLessons.length > 0 
          ? prevLessons[0].id 
          : null,
        nextLessonId: Array.isArray(nextLessons) && nextLessons.length > 0 
          ? nextLessons[0].id 
          : null
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error in lesson navigation API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}