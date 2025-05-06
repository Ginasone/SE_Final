import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

// Define only the interfaces we actually use
interface ProgressRecord extends RowDataPacket {
  id: number;
  completed: boolean;
  completed_at?: string;
}

// For JWT payload
interface JwtUserPayload {
  userId: number;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  name: string;
  schoolId?: number;
}

// For count query results
interface CountQueryResult extends RowDataPacket {
  count: number;
}

// Define type for the route params
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
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

/**
 * POST handler for marking lessons as complete
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
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
  
  // Only students and admins can mark lessons as complete
  if (decoded.role !== 'student' && decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only students can mark lessons as complete' },
      { status: 403 }
    );
  }

  const userId = decoded.userId;
  
  // Validate enrollment and lesson existence
  const connection = await getConnection();
  
  try {
    // Check enrollment (unless admin)
    if (decoded.role !== 'admin') {
      const [enrollments] = await connection.execute<CountQueryResult[]>(
        `SELECT COUNT(*) as count FROM enrollments 
         WHERE student_id = ? AND course_id = ? AND status = 'active'`,
        [userId, courseId]
      );

      if (!Array.isArray(enrollments) || 
          enrollments.length === 0 || 
          enrollments[0].count === 0) {
        return NextResponse.json(
          { error: 'You are not enrolled in this course' },
          { status: 403 }
        );
      }
    }
    
    // Check if lesson exists and belongs to course
    const [lessons] = await connection.execute<CountQueryResult[]>(
      `SELECT COUNT(*) as count FROM lessons 
       WHERE id = ? AND course_id = ?`,
      [lessonId, courseId]
    );

    if (!Array.isArray(lessons) || 
        lessons.length === 0 || 
        lessons[0].count === 0) {
      return NextResponse.json(
        { error: 'Lesson not found in this course' },
        { status: 404 }
      );
    }

    // Check if progress record already exists
    const [existingProgressRows] = await connection.execute<ProgressRecord[]>(
      `SELECT id, completed FROM user_progress 
       WHERE user_id = ? AND course_id = ? AND lesson_id = ?`,
      [userId, courseId, lessonId]
    );

    // Begin transaction
    await connection.beginTransaction();

    try {
      if (Array.isArray(existingProgressRows) && existingProgressRows.length > 0) {
        // If record exists but not completed, update it
        const progress = existingProgressRows[0];
        if (!progress.completed) {
          await connection.execute(
            `UPDATE user_progress 
             SET completed = 1, completed_at = NOW() 
             WHERE id = ?`,
            [progress.id]
          );
        }
      } else {
        // If no record exists, create a new one
        await connection.execute(
          `INSERT INTO user_progress (user_id, course_id, lesson_id, completed, completed_at) 
           VALUES (?, ?, ?, 1, NOW())`,
          [userId, courseId, lessonId]
        );
      }

      // Create a notification about progress update
      await connection.execute(
        `INSERT INTO notifications (user_id, message, is_read, created_at)
         VALUES (?, ?, 0, NOW())`,
        [
          userId,
          `You've made progress in your course! Course ID: ${courseId}`
        ]
      );

      // Commit transaction
      await connection.commit();

      return NextResponse.json({ 
        success: true,
        message: 'Lesson marked as completed'
      }, { status: 200 });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error('Error completing lesson:', error);
      
      return NextResponse.json({ 
        error: 'Failed to mark lesson as completed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in lesson completion API:', error);
    return NextResponse.json({ 
      error: 'Failed to process request'
    }, { status: 500 });
  } finally {
    await connection.end();
  }
}