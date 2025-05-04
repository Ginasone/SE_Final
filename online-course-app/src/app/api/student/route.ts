/**
 * Student API Routes
 * 
 * Implements the Controller layer in the MVC pattern.
 * These API routes handle HTTP requests for student data
 * and delegate business logic to the service layer.
 * 
 * @author Nadia
 */

import { NextResponse } from 'next/server';
import StudentService from '../services/StudentService';


/**
 * GET handler for student dashboard data
 * 
 * ENDPOINT: /api/student?studentId=X
 * PURPOSE: Fetch dashboard data for a specific student
 * ACCESS: Authenticated students (self) or admins
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with student data
 */
export async function GET(req: Request) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    // Input validation (could be extracted to a middleware)
    if (!studentId || isNaN(Number(studentId))) {
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }

    // Authentication check (simplified - in production, use middleware)
    // This would use the verifyAuthToken middleware in a real implementation
    // const authResult = await verifyAuthToken(req);
    // if (!authResult.isAuthenticated) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Authorization check (make sure user can access this student's data)
    // if (authResult.user.role !== 'admin' && authResult.user.id !== Number(studentId)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Delegate to service layer - Single Responsibility Principle
    const studentData = await StudentService.getStudentDashboardData(Number(studentId));
    
    // Handle not found case
    if (!studentData.profile) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Return successful response with data
    return NextResponse.json(studentData);
    
  } catch (error) {
    // Error handling with appropriate status codes
    console.error('Error in student API route:', error);
    
    // Determine if it's a client or server error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isClientError = errorMessage.includes('invalid') || errorMessage.includes('required');
    
    return NextResponse.json(
      { error: errorMessage },
      { status: isClientError ? 400 : 500 }
    );
  }
}