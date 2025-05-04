/**
 * API Route for Available Courses
 * 
 * This endpoint fetches courses available for enrollment
 * that the student is not already enrolled in.
 */

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

// Define interfaces for database results
interface StudentRow extends RowDataPacket {
  id: number;
  school_id: number;
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

/**
 * GET handler for available courses
 * 
 * ENDPOINT: /api/courses/available?studentId=X
 * PURPOSE: Fetch courses that a student can enroll in
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with available courses
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
      console.log(`Fetching available courses for student ID: ${studentId}`);
      
      // First check if student exists and get school_id
      const [studentRows] = await connection.execute<StudentRow[]>(
        "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'",
        [studentId]
      );
      
      if (studentRows.length === 0) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      const studentSchoolId = studentRows[0].school_id;
      
      // Get courses the student is not enrolled in yet
      // that are published status and from the student's school
      const [courseRows] = await connection.execute<CourseRow[]>(
        `SELECT c.id, c.title, c.description, c.thumbnail, c.start_date, c.end_date, 
                c.status, c.difficulty_level, s.name as school_name,
                u.full_name as teacher_name
         FROM courses c
         LEFT JOIN schools s ON c.school_id = s.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.status = 'published'
         AND c.school_id = ?
         AND c.id NOT IN (
           SELECT course_id FROM enrollments WHERE student_id = ?
         )
         ORDER BY c.start_date DESC`,
        [studentSchoolId, studentId]
      );
      
      return NextResponse.json(courseRows);
    } finally {
      // Always close the database connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error in available courses API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}