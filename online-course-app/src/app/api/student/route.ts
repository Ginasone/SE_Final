/**
 * Student API Routes
 * 
 * Implements the Controller layer in the MVC pattern.
 * These API routes handle HTTP requests for student dashboard data
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
    console.log('Student dashboard API endpoint called');
    
    // Get query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    // Input validation
    if (!studentId || isNaN(Number(studentId))) {
      console.error('Invalid student ID:', studentId);
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }

    // Delegate to service layer
    console.log(`Fetching dashboard data for student ID: ${studentId}`);
    const studentData = await StudentService.getStudentDashboardData(Number(studentId));
    
    // Handle not found case
    if (!studentData.profile) {
      console.error(`Student not found: ${studentId}`);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log(`Successfully retrieved dashboard data for student ID: ${studentId}`);
    
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