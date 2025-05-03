/**
 * Student Courses API Routes
 * 
 * Implements the Controller layer in the MVC pattern for student courses.
 * Applies the REST architectural style for handling course-related endpoints.
 * 
 * @author Team Course Portal
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import StudentService from '../../services/StudentService';
import { rateLimit } from '../../../middlewares/rateLimitMiddleware';

/**
 * GET handler for enrolled courses
 * 
 * ENDPOINT: /api/student/courses?studentId=X
 * PURPOSE: Fetch all courses a student is enrolled in with progress data
 * ACCESS: Authenticated students (self) or admins
 * 
 * This implements the facade pattern by providing a simple interface to 
 * complex underlying operations performed by the service layer.
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with courses data
 */
export async function GET(req: Request) {
  try {
    // Apply rate limiting (in production)
    // const rateLimitResult = await rateLimit(req, 60, 10); // 10 requests per minute
    // if (!rateLimitResult.success) {
    //   return NextResponse.json(
    //     { error: 'Rate limit exceeded. Try again later.' },
    //     { status: 429 }
    //   );
    // }
    
    // Extract and validate query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId || isNaN(Number(studentId))) {
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }

    // Delegate to service layer for business logic
    const coursesWithProgress = await StudentService.getCoursesWithProgress(Number(studentId));
    
    // Add cache control headers for better performance
    // This assumes course data doesn't change often
    const headers = new Headers();
    headers.append('Cache-Control', 'max-age=60'); // Cache for 1 minute
    
    // Return response with cache headers
    return NextResponse.json(
      coursesWithProgress, 
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    // Structured error handling
    console.error('Error in courses API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}