/**
 * API Route for Course Lessons
 * 
 * This endpoint provides a list of lessons for a specific course.
 * Implements the Repository pattern to separate data access from business logic.
 * 
 * Design patterns used:
 * - Repository Pattern: Separates data access logic
 * - Strategy Pattern: Different strategies for authentication and error handling
 * - Factory Pattern: Connection factory for database access
 */

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

/**
 * Connection Factory - Creates and returns database connections
 * Following the Factory Pattern to centralize connection creation
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
 * Authentication Strategy - Verifies JWT tokens
 * Part of the Strategy Pattern for different authentication approaches
 */
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

/**
 * LessonRepository - Handles data access for lessons
 * Implementation of the Repository Pattern
 */
class LessonRepository {
  /**
   * Get all lessons for a course with completion status for a specific user
   * 
   * @param connection MySQL connection
   * @param courseId Course ID
   * @param userId User ID
   * @returns Array of lessons with completion status
   */
  async getLessonsForCourse(connection: mysql.Connection, courseId: number, userId: number) {
    // Get all lessons for the course ordered by position
    const [lessons] = await connection.execute(
      `SELECT l.id, l.title, l.content, l.video_url, l.position
       FROM lessons l
       WHERE l.course_id = ?
       ORDER BY l.position ASC`,
      [courseId]
    );

    // Get completion status for each lesson
    const [completedLessons] = await connection.execute(
      `SELECT lesson_id 
       FROM user_progress 
       WHERE user_id = ? AND course_id = ? AND completed = 1`,
      [userId, courseId]
    );

    // Create a set of completed lesson IDs for quick lookup
    const completedLessonIds = new Set();
    if (Array.isArray(completedLessons)) {
      completedLessons.forEach((item: any) => {
        completedLessonIds.add(item.lesson_id);
      });
    }

    // Combine lesson data with completion status
    return Array.isArray(lessons) ? lessons.map((lesson: any) => ({
      ...lesson,
      completed: completedLessonIds.has(lesson.id)
    })) : [];
  }

  /**
   * Check if user is enrolled in the course
   * 
   * @param connection MySQL connection
   * @param courseId Course ID
   * @param userId User ID
   * @returns Boolean indicating enrollment status
   */
  async isUserEnrolledInCourse(connection: mysql.Connection, courseId: number, userId: number) {
    const [enrollments] = await connection.execute(
      `SELECT id FROM enrollments 
       WHERE student_id = ? AND course_id = ? AND status = 'active'`,
      [userId, courseId]
    );

    return Array.isArray(enrollments) && enrollments.length > 0;
  }
}

/**
 * GET handler for course lessons
 * 
 * ENDPOINT: /api/courses/{courseId}/lessons
 * PURPOSE: Fetch all lessons for a specific course with completion status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Validate authentication
    const authHeader = req.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate course ID
    const courseId = params.courseId;
    if (!courseId || isNaN(Number(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Establish database connection
    const connection = await getConnection();
    const lessonRepository = new LessonRepository();

    try {
      // Check if user is enrolled in the course (unless they're an admin)
      if (decoded.role !== 'admin') {
        const isEnrolled = await lessonRepository.isUserEnrolledInCourse(
          connection, 
          Number(courseId), 
          decoded.userId
        );

        if (!isEnrolled) {
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      }
      
      // Get lessons with completion status
      const lessons = await lessonRepository.getLessonsForCourse(
        connection, 
        Number(courseId), 
        decoded.userId
      );

      return NextResponse.json(lessons);
    } finally {
      // Always close connections
      await connection.end();
    }
  } catch (error) {
    // Error handling strategy
    console.error('Error in lessons API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}