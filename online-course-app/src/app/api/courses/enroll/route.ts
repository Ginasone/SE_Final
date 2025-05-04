/**
 * API Route for Course Enrollment
 * 
 * This endpoint handles enrolling a student in a course.
 */

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket, OkPacket } from 'mysql2';

// Define interfaces for database results
interface StudentRow extends RowDataPacket {
  id: number;
  school_id: number;
}

interface CourseRow extends RowDataPacket {
  id: number;
  school_id: number;
  status: string;
}

interface EnrollmentRow extends RowDataPacket {
  id: number;
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
 * POST handler for course enrollment
 * 
 * ENDPOINT: /api/courses/enroll
 * PURPOSE: Enroll a student in a course
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with enrollment status
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { studentId, courseId } = body;
    
    // Input validation
    if (!studentId || isNaN(Number(studentId))) {
      return NextResponse.json(
        { error: 'Valid student ID is required' },
        { status: 400 }
      );
    }
    
    if (!courseId || isNaN(Number(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Get database connection
    const connection = await getConnection();

    try {
      console.log(`Enrolling student ID: ${studentId} in course ID: ${courseId}`);
      
      // Check if the student exists
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
      
      // Check if the course exists and is published
      const [courseRows] = await connection.execute<CourseRow[]>(
        "SELECT id, school_id, status FROM courses WHERE id = ?",
        [courseId]
      );
      
      if (courseRows.length === 0) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
      
      const course = courseRows[0];
      
      // Check if course is published
      if (course.status !== 'published') {
        return NextResponse.json(
          { error: 'Cannot enroll in unpublished course' },
          { status: 400 }
        );
      }
      
      // Check if course belongs to student's school
      if (course.school_id !== studentSchoolId) {
        return NextResponse.json(
          { error: 'Cannot enroll in course from different school' },
          { status: 403 }
        );
      }
      
      // Check if student is already enrolled
      const [enrollmentRows] = await connection.execute<EnrollmentRow[]>(
        "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
        [studentId, courseId]
      );
      
      if (enrollmentRows.length > 0) {
        return NextResponse.json(
          { error: 'Student already enrolled in this course' },
          { status: 409 }
        );
      }
      
      // Create enrollment record
      const [result] = await connection.execute<OkPacket>(
        `INSERT INTO enrollments 
         (student_id, course_id, enrolled_at, status) 
         VALUES (?, ?, NOW(), 'active')`,
        [studentId, courseId]
      );
      
      // Create an initial notification
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, message, is_read, created_at) 
         VALUES (?, ?, 0, NOW())`,
        [
          studentId, 
          `You have successfully enrolled in a new course. Course ID: ${courseId}`
        ]
      );
      
      // Return success response
      return NextResponse.json({
        message: 'Successfully enrolled in course',
        enrollmentId: result.insertId
      });
    } finally {
      // Always close the database connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error in course enrollment API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}