/**
 * API Route for Student Courses
 * 
 * This file provides a simplified API route for fetching student courses
 * with improved error handling and response structure.
 */

import { NextResponse } from 'next/server';

// Use MySQL2 promise interface for database queries
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2'; // Import the RowDataPacket type

// JWT for authentication verification
import jwt from 'jsonwebtoken';

// Define interfaces for our database results
interface EnrollmentCount extends RowDataPacket {
  count: number;
}

interface StudentRow extends RowDataPacket {
  id: number;
}

interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  start_date: string;
  end_date: string;
  status: string;
  difficulty_level: string | null;
  school_name: string | null;
  teacher_name: string | null;
  enrollment_status: string;
}

// Database connection helper
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coursesite',
  });
}

// Verify authentication token
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
 * GET handler for student courses
 * 
 * ENDPOINT: /api/student/courses?studentId=X
 * PURPOSE: Fetch all courses a student is enrolled in
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with courses data
 */
export async function GET(req: Request) {
  try {
    // Get auth header
    const authHeader = req.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    // Input validation
    if (!studentId || isNaN(Number(studentId))) {
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }

    // Additional authorization check - only allow access to own data or admin
    if (decoded.role !== 'admin' && decoded.userId !== Number(studentId)) {
      return NextResponse.json(
        { error: 'Unauthorized access to student data' },
        { status: 403 }
      );
    }

    // Get database connection
    const connection = await getConnection();

    try {
      console.log(`Fetching courses for student ID: ${studentId}`);
      
      // First check if student exists and has proper role
      const [studentCheck] = await connection.execute<StudentRow[]>(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [studentId]
      );
      
      if (!Array.isArray(studentCheck) || studentCheck.length === 0) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // Check if student has any enrollments
      const [enrollmentCheck] = await connection.execute<EnrollmentCount[]>(
        "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?",
        [studentId]
      );
      
      // Early return if no enrollments
      if (Array.isArray(enrollmentCheck) && 
          enrollmentCheck.length > 0 && 
          enrollmentCheck[0].count === 0) {
        console.log(`Student ${studentId} has no enrollments`);
        return NextResponse.json([]);
      }
      
      // Get enrolled courses with data we need
      const [rows] = await connection.execute<CourseRow[]>(
        `SELECT c.id, c.title, c.description, c.thumbnail, c.start_date, c.end_date, 
                c.status, c.difficulty_level, s.name as school_name,
                u.full_name as teacher_name,
                e.status as enrollment_status
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN schools s ON c.school_id = s.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE e.student_id = ? AND e.status = 'active'
         ORDER BY c.start_date DESC`,
        [studentId]
      );
      
      // Add cache control headers
      const headers = new Headers();
      headers.append('Cache-Control', 'max-age=60'); // Cache for 1 minute
      
      return NextResponse.json(
        rows || [], 
        { 
          status: 200,
          headers
        }
      );
    } finally {
      // Always close the database connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error in courses API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}