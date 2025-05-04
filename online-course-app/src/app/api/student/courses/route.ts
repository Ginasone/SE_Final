/**
 * Student Courses API Routes
 * 
 * 
 * @author Nadia
 */

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

// Database connection helper - uses environment variables
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coursesite',
  });
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

    // Get database connection
    const connection = await getConnection();

    try {
      console.log(`Fetching courses for student ID: ${studentId}`);
      
      // First check if student exists and has proper role
      const [studentCheck] = await connection.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [studentId]
      );
      
      if (!Array.isArray(studentCheck) || studentCheck.length === 0) {
        console.log(`Student ID ${studentId} not found or not a student role`);
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      // Check if student has any enrollments
      const [enrollmentCheck] = await connection.execute(
        "SELECT COUNT(*) as count FROM enrollments WHERE student_id = ?",
        [studentId]
      );
      
      // If no enrollments, return empty array
      if (Array.isArray(enrollmentCheck) && 
          enrollmentCheck.length > 0 && 
          enrollmentCheck[0].count === 0) {
        console.log(`Student ${studentId} has no enrollments`);
        return NextResponse.json([]);
      }
      
      // Get enrolled courses with data we need
      const [rows] = await connection.execute(
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
      
      return NextResponse.json(rows || []);
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