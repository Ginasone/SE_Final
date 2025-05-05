/**
 * API Route for Lesson Navigation
 * 
 * This endpoint provides navigation information (previous and next lesson)
 * for a specific lesson within a course.
 * 
 * Design patterns used:
 * - Chain of Responsibility: For request processing flow
 * - Repository Pattern: For data access separation
 * - Decorator Pattern: For enhancing database results
 */

import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

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
 * Interface for Chain of Responsibility handlers
 */
interface RequestHandler {
  process(req: NextRequest, params: any): Promise<NextResponse>;
  setNext(handler: RequestHandler): RequestHandler;
}

/**
 * Auth Handler - First part of the Chain of Responsibility
 * Processes the authentication aspect of the request
 */
class AuthHandler implements RequestHandler {
  private nextHandler: RequestHandler | null = null;

  setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  async process(req: NextRequest, params: any): Promise<NextResponse> {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const decoded = this.verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Pass to next handler with auth data
    if (this.nextHandler) {
      return this.nextHandler.process(req, { ...params, decoded });
    }

    return NextResponse.json({});
  }

  private verifyToken(authorization: string | null) {
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
 * Validation Handler - Next in the Chain of Responsibility
 * Validates the request parameters
 */
class ValidationHandler implements RequestHandler {
  private nextHandler: RequestHandler | null = null;

  setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  async process(req: NextRequest, params: any): Promise<NextResponse> {
    const { courseId, lessonId } = params;
    
    if (isNaN(Number(courseId)) || isNaN(Number(lessonId))) {
      return NextResponse.json(
        { error: 'Valid course and lesson IDs are required' },
        { status: 400 }
      );
    }

    // Pass to next handler with validated data
    if (this.nextHandler) {
      return this.nextHandler.process(req, { 
        ...params, 
        courseId: Number(courseId), 
        lessonId: Number(lessonId) 
      });
    }

    return NextResponse.json({});
  }
}

/**
 * Access Check Handler - Next in the Chain of Responsibility
 * Verifies the user has access to the requested resource
 */
class AccessCheckHandler implements RequestHandler {
  private nextHandler: RequestHandler | null = null;

  setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  async process(req: NextRequest, params: any): Promise<NextResponse> {
    const { decoded, courseId } = params;

    // Admin has access to everything
    if (decoded.role === 'admin') {
      if (this.nextHandler) {
        return this.nextHandler.process(req, params);
      }
      return NextResponse.json({});
    }

    // Check enrollment for non-admin users
    const connection = await getConnection();
    try {
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

      // Pass to next handler if enrolled
      if (this.nextHandler) {
        return this.nextHandler.process(req, params);
      }

      return NextResponse.json({});
    } finally {
      await connection.end();
    }
  }
}

/**
 * Navigation Repository - Implements the Repository Pattern
 * Handles data access for lesson navigation
 */
class NavigationRepository {
  /**
   * Get navigation information for a lesson
   * 
   * @param courseId Course ID 
   * @param lessonId Current Lesson ID
   * @returns Navigation information with prev/next lesson IDs
   */
  async getNavigation(courseId: number, lessonId: number): Promise<{ 
    prevLessonId: number | null; 
    nextLessonId: number | null; 
  }> {
    const connection = await getConnection();
    
    try {
      // Get current lesson position
      const [currentLesson] = await connection.execute(
        `SELECT position FROM lessons WHERE id = ? AND course_id = ?`,
        [lessonId, courseId]
      );

      if (!Array.isArray(currentLesson) || currentLesson.length === 0) {
        return { prevLessonId: null, nextLessonId: null };
      }

      const currentPosition = (currentLesson[0] as any).position;

      // Get previous lesson
      const [prevLesson] = await connection.execute(
        `SELECT id FROM lessons 
         WHERE course_id = ? AND position < ? 
         ORDER BY position DESC 
         LIMIT 1`,
        [courseId, currentPosition]
      );

      // Get next lesson
      const [nextLesson] = await connection.execute(
        `SELECT id FROM lessons 
         WHERE course_id = ? AND position > ? 
         ORDER BY position ASC 
         LIMIT 1`,
        [courseId, currentPosition]
      );

      return {
        prevLessonId: Array.isArray(prevLesson) && prevLesson.length > 0 
          ? (prevLesson[0] as any).id 
          : null,
        nextLessonId: Array.isArray(nextLesson) && nextLesson.length > 0 
          ? (nextLesson[0] as any).id 
          : null
      };
    } finally {
      await connection.end();
    }
  }
}

/**
 * Navigation Handler - Final handler in the Chain of Responsibility
 * Processes the actual navigation logic
 */
class NavigationHandler implements RequestHandler {
  private navigationRepository: NavigationRepository;
  private nextHandler: RequestHandler | null = null;
  
  constructor(repository: NavigationRepository) {
    this.navigationRepository = repository;
  }

  setNext(handler: RequestHandler): RequestHandler {
    this.nextHandler = handler;
    return handler;
  }

  async process(req: NextRequest, params: any): Promise<NextResponse> {
    const { courseId, lessonId } = params;
    
    try {
      const navigationData = await this.navigationRepository.getNavigation(
        courseId, 
        lessonId
      );
      
      return NextResponse.json(navigationData);
    } catch (error) {
      console.error('Error in navigation handler:', error);
      return NextResponse.json(
        { error: 'Failed to get lesson navigation' },
        { status: 500 }
      );
    }
  }
}

/**
 * GET handler for lesson navigation
 * 
 * ENDPOINT: /api/courses/{courseId}/lessons/{lessonId}/navigation
 * PURPOSE: Get previous and next lesson IDs for navigation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    // Initialize repositories
    const navigationRepository = new NavigationRepository();
    
    // Setup Chain of Responsibility
    const authHandler = new AuthHandler();
    const validationHandler = new ValidationHandler();
    const accessCheckHandler = new AccessCheckHandler();
    const navigationHandler = new NavigationHandler(navigationRepository);

    // Link the chain
    authHandler
      .setNext(validationHandler)
      .setNext(accessCheckHandler)
      .setNext(navigationHandler);

    // Start processing the request
    return await authHandler.process(req, params);
  } catch (error) {
    console.error('Error in lesson navigation API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}