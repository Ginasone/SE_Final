/**
 * API Route for Marking Lessons as Complete
 * 
 * This endpoint handles the process of marking a lesson as completed by a student.
 * 
 * Design patterns used:
 * - Command Pattern: For encapsulating the mark-as-complete operation
 * - Repository Pattern: For data access separation
 * - Observer Pattern: For progress tracking notifications
 * - Template Method: For structuring the API request handling
 */

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

// Define RequestParams type for better clarity
interface RequestParams {
  courseId: string | number;
  lessonId: string | number;
  userId?: number;
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
 * Abstract class implementing the Template Method pattern
 * Defines the skeleton of the API request handling process
 */
abstract class ApiRequestHandler {
  /**
   * Template method that defines the algorithm structure
   */
  async handleRequest(req: NextRequest, params: Record<string, string>): Promise<NextResponse> {
    // 1. Authenticate the request
    const authResult = await this.authenticate(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.statusCode }
      );
    }

    // 2. Validate the request parameters
    const validationResult = this.validateParams(params, authResult.decoded);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.message },
        { status: validationResult.statusCode }
      );
    }

    // 3. Process the business logic
    const processResult = await this.processRequest(
      validationResult.params, // Now guaranteed to exist when success is true
      authResult.decoded
    );

    // 4. Return the appropriate response
    return NextResponse.json(
      processResult.data,
      { status: processResult.statusCode }
    );
  }

  /**
   * Authentication step - to be implemented by concrete classes
   */
  protected abstract authenticate(req: NextRequest): Promise<{
    success: boolean;
    decoded?: JwtUserPayload;
    message?: string;
    statusCode?: number;
  }>;

  /**
   * Parameter validation step - to be implemented by concrete classes
   * Using discriminated union types for better type safety
   */
  protected abstract validateParams(
    params: Record<string, string>, 
    decoded: JwtUserPayload | undefined
  ): {
    success: true;
    params: RequestParams; // No longer optional when success is true
    message?: string;
    statusCode?: number;
  } | {
    success: false;
    message: string;
    statusCode: number;
  };

  /**
   * Business logic processing step - to be implemented by concrete classes
   */
  protected abstract processRequest(
    params: RequestParams, 
    decoded: JwtUserPayload | undefined
  ): Promise<{
    data: Record<string, unknown>;
    statusCode: number;
  }>;
}

/**
 * Progress Repository - Implements the Repository Pattern
 * Handles data access for user progress
 */
class ProgressRepository {
  /**
   * Mark a lesson as completed
   * 
   * @param connection Database connection
   * @param userId User ID
   * @param courseId Course ID
   * @param lessonId Lesson ID
   * @returns Success status
   */
  async markLessonAsCompleted(
    connection: mysql.Connection,
    userId: number,
    courseId: number,
    lessonId: number
  ): Promise<boolean> {
    // Check if progress record already exists
    const [existingProgressRows] = await connection.execute<ProgressRecord[]>(
      `SELECT id, completed FROM user_progress 
       WHERE user_id = ? AND course_id = ? AND lesson_id = ?`,
      [userId, courseId, lessonId]
    );

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

    return true;
  }

  /**
   * Check if user is enrolled in the course
   * 
   * @param connection Database connection
   * @param userId User ID
   * @param courseId Course ID
   * @returns Enrollment status
   */
  async isUserEnrolledInCourse(
    connection: mysql.Connection,
    userId: number,
    courseId: number
  ): Promise<boolean> {
    const [enrollments] = await connection.execute<CountQueryResult[]>(
      `SELECT COUNT(*) as count FROM enrollments 
       WHERE student_id = ? AND course_id = ? AND status = 'active'`,
      [userId, courseId]
    );

    return Array.isArray(enrollments) && 
           enrollments.length > 0 && 
           enrollments[0].count > 0;
  }

  /**
   * Check if lesson exists and belongs to course
   * 
   * @param connection Database connection
   * @param lessonId Lesson ID
   * @param courseId Course ID
   * @returns Lesson validity status
   */
  async isLessonValid(
    connection: mysql.Connection,
    lessonId: number,
    courseId: number
  ): Promise<boolean> {
    const [lessons] = await connection.execute<CountQueryResult[]>(
      `SELECT COUNT(*) as count FROM lessons 
       WHERE id = ? AND course_id = ?`,
      [lessonId, courseId]
    );

    return Array.isArray(lessons) && 
           lessons.length > 0 && 
           lessons[0].count > 0;
  }
}

/**
 * Observer for tracking progress - implements the Observer Pattern
 */
class ProgressObserver {
  async notifyProgressUpdate(
    connection: mysql.Connection,
    userId: number,
    courseId: number
  ): Promise<void> {
    try {
      // Create a notification about progress update
      await connection.execute(
        `INSERT INTO notifications (user_id, message, is_read, created_at)
         VALUES (?, ?, 0, NOW())`,
        [
          userId,
          `You've made progress in your course! Course ID: ${courseId}`
        ]
      );
      
      // Calculate and update overall course progress (optional)
      await this.updateCourseProgress(connection, userId, courseId);
    } catch (err) {
      console.error('Error in progress notification:', err);
      // Continue execution even if notification fails
    }
  }
  
  private async updateCourseProgress(
    connection: mysql.Connection,
    userId: number,
    courseId: number
  ): Promise<void> {
    try {
      // This method could calculate overall progress percentage
      // and update some course_progress table if you have one
      
      // For now, we'll just log a message
      console.log(`Updated progress for user ${userId} in course ${courseId}`);
    } catch (err) {
      console.error('Error updating course progress:', err);
    }
  }
}

/**
 * Command to mark lesson as complete - implements the Command Pattern
 */
class MarkLessonCompleteCommand {
  private progressRepository: ProgressRepository;
  private progressObserver: ProgressObserver;
  
  constructor() {
    this.progressRepository = new ProgressRepository();
    this.progressObserver = new ProgressObserver();
  }
  
  /**
   * Execute the command
   */
  async execute(userId: number, courseId: number, lessonId: number): Promise<boolean> {
    const connection = await getConnection();
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Mark the lesson as completed
      await this.progressRepository.markLessonAsCompleted(
        connection, 
        userId, 
        courseId, 
        lessonId
      );
      
      // Notify about the progress update
      await this.progressObserver.notifyProgressUpdate(
        connection,
        userId,
        courseId
      );
      
      // Commit transaction
      await connection.commit();
      
      return true;
    } catch (err) {
      // Rollback on error
      await connection.rollback();
      console.error('Error executing mark lesson complete command:', err);
      throw err;
    } finally {
      await connection.end();
    }
  }
}

/**
 * Concrete implementation of ApiRequestHandler for lesson completion
 */
class LessonCompletionHandler extends ApiRequestHandler {
  private command: MarkLessonCompleteCommand;
  private progressRepository: ProgressRepository;
  
  constructor() {
    super();
    this.command = new MarkLessonCompleteCommand();
    this.progressRepository = new ProgressRepository();
  }
  
  /**
   * Authentication step implementation
   */
  protected async authenticate(req: NextRequest): Promise<{
    success: boolean;
    decoded?: JwtUserPayload;
    message?: string;
    statusCode?: number;
  }> {
    const authHeader = req.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401
      };
    }
    
    // Only students can mark lessons as complete
    if (decoded.role !== 'student' && decoded.role !== 'admin') {
      return {
        success: false,
        message: 'Only students can mark lessons as complete',
        statusCode: 403
      };
    }
    
    return {
      success: true,
      decoded
    };
  }
  
  /**
   * Parameter validation step implementation
   * Using discriminated union types for better type safety
   */
  protected validateParams(
    params: Record<string, string>, 
    decoded: JwtUserPayload | undefined
  ): {
    success: true;
    params: RequestParams;
  } | {
    success: false;
    message: string;
    statusCode: number;
  } {
    // Make sure decoded is not undefined
    if (!decoded) {
      return {
        success: false,
        message: 'Authentication required',
        statusCode: 401
      };
    }
  
    const courseId = Number(params.courseId);
    const lessonId = Number(params.lessonId);
    
    if (isNaN(courseId) || isNaN(lessonId)) {
      return {
        success: false,
        message: 'Valid course and lesson IDs are required',
        statusCode: 400
      };
    }
    
    return {
      success: true,
      params: {
        courseId,
        lessonId,
        userId: decoded.userId
      }
    };
  }
  
  /**
   * Business logic processing step implementation
   */
  protected async processRequest(
    params: RequestParams, 
    decoded: JwtUserPayload | undefined
  ): Promise<{
    data: Record<string, unknown>;
    statusCode: number;
  }> {
    if (!decoded) {
      return {
        data: { error: 'Authentication required' },
        statusCode: 401
      };
    }

    const { userId, courseId, lessonId } = params;
    
    if (!userId) {
      return {
        data: { error: 'User ID is required' },
        statusCode: 400
      };
    }
    
    // Validate enrollment and lesson existence
    const connection = await getConnection();
    try {
      // Check enrollment (unless admin)
      if (decoded.role !== 'admin') {
        const isEnrolled = await this.progressRepository.isUserEnrolledInCourse(
          connection, 
          userId, 
          Number(courseId)
        );
        
        if (!isEnrolled) {
          return {
            data: { error: 'You are not enrolled in this course' },
            statusCode: 403
          };
        }
      }
      
      // Check if lesson exists and belongs to course
      const isValidLesson = await this.progressRepository.isLessonValid(
        connection, 
        Number(lessonId), 
        Number(courseId)
      );
      
      if (!isValidLesson) {
        return {
          data: { error: 'Lesson not found in this course' },
            statusCode: 404
          };
      }
    } finally {
      await connection.end();
    }
    
    // Execute the command to mark lesson as complete
    try {
      await this.command.execute(
        userId, 
        Number(courseId), 
        Number(lessonId)
      );
      
      return {
        data: { 
          success: true,
          message: 'Lesson marked as completed'
        },
        statusCode: 200
      };
    } catch (err) {
      console.error('Error processing lesson completion:', err);
      return {
        data: { 
          error: 'Failed to mark lesson as completed'
        },
        statusCode: 500
      };
    }
  }
}

/**
 * POST handler for marking lessons as complete
 * 
 * ENDPOINT: /api/courses/{courseId}/lessons/{lessonId}/complete
 * PURPOSE: Mark a specific lesson as completed by the student
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  const handler = new LessonCompletionHandler();
  return handler.handleRequest(req, params);
}