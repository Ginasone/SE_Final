/**
 * API Route for Lesson Details
 * 
 * This endpoint provides detailed information about a specific lesson.
 * Implements multiple design patterns for maintainability and separation of concerns.
 * 
 * Design patterns used:
 * - Repository Pattern: For data access separation
 * - Facade Pattern: Simplifies complex database operations
 * - Singleton Pattern: For database connection management
 */

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2"; // Import RowDataPacket type

// Define interfaces for our database results
interface LessonRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  video_url: string;
  position: number;
}

interface ProgressRow extends RowDataPacket {
  completed: number; // In MySQL, boolean is stored as 0/1
}

/**
 * Database Connection Singleton
 * Ensures only one connection factory exists
 */
class DatabaseConnector {
  private static instance: DatabaseConnector;

  private constructor() {}

  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  async getConnection() {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'coursesite',
    });
  }
}

/**
 * Authentication Service
 * Handles token verification
 */
class AuthService {
  verifyToken(authorization: string | null) {
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
}

/**
 * LessonRepository class
 * Implements the Repository pattern for lesson data operations
 */
class LessonRepository {
  async getLessonById(connection: mysql.Connection, lessonId: number, courseId: number): Promise<LessonRow | null> {
    const [lessons] = await connection.execute<LessonRow[]>(
      `SELECT l.id, l.title, l.content, l.video_url, l.position
       FROM lessons l
       WHERE l.id = ? AND l.course_id = ?`,
      [lessonId, courseId]
    );

    return lessons.length > 0 ? lessons[0] : null;
  }

  async getLessonCompletionStatus(connection: mysql.Connection, lessonId: number, userId: number, courseId: number): Promise<boolean> {
    const [progress] = await connection.execute<ProgressRow[]>(
      `SELECT completed 
       FROM user_progress 
       WHERE user_id = ? AND lesson_id = ? AND course_id = ?`,
      [userId, lessonId, courseId]
    );

    return progress.length > 0 ? !!progress[0].completed : false;
  }

  async isUserEnrolledInCourse(connection: mysql.Connection, courseId: number, userId: number): Promise<boolean> {
    const [enrollments] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM enrollments 
       WHERE student_id = ? AND course_id = ? AND status = 'active'`,
      [userId, courseId]
    );

    return enrollments.length > 0;
  }
}

/**
 * Lesson Facade
 * Implements the Facade pattern to simplify complex operations
 */
class LessonFacade {
  private lessonRepository: LessonRepository;
  
  constructor(repository: LessonRepository) {
    this.lessonRepository = repository;
  }

  async getLessonWithCompletionStatus(connection: mysql.Connection, lessonId: number, courseId: number, userId: number) {
    // Get base lesson data
    const lesson = await this.lessonRepository.getLessonById(connection, lessonId, courseId);
    
    if (!lesson) {
      return null;
    }

    // Check completion status
    const isCompleted = await this.lessonRepository.getLessonCompletionStatus(
      connection, 
      lessonId, 
      userId, 
      courseId
    );

    // Combine the data
    return {
      ...lesson,
      completed: isCompleted
    };
  }
}

/**
 * GET handler for lesson details
 * 
 * ENDPOINT: /api/courses/{courseId}/lessons/{lessonId}
 * PURPOSE: Fetch detailed information about a specific lesson
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    // Initialize services
    const authService = new AuthService();
    const lessonRepository = new LessonRepository();
    const lessonFacade = new LessonFacade(lessonRepository);
    
    // Validate authentication
    const authHeader = req.headers.get('authorization');
    const decoded = authService.verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate parameters
    const courseId = Number(params.courseId);
    const lessonId = Number(params.lessonId);
    
    if (isNaN(courseId) || isNaN(lessonId)) {
      return NextResponse.json(
        { error: 'Valid course and lesson IDs are required' },
        { status: 400 }
      );
    }

    // Get database connection using singleton
    const connector = DatabaseConnector.getInstance();
    const connection = await connector.getConnection();

    try {
      // Check course enrollment for non-admin users
      if (decoded.role !== 'admin') {
        const isEnrolled = await lessonRepository.isUserEnrolledInCourse(
          connection, 
          courseId, 
          decoded.userId
        );

        if (!isEnrolled) {
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      }
      
      // Get lesson details with completion status
      const lesson = await lessonFacade.getLessonWithCompletionStatus(
        connection, 
        lessonId, 
        courseId, 
        decoded.userId
      );

      if (!lesson) {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(lesson);
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