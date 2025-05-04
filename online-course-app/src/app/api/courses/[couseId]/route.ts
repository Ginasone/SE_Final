import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

/**
 * Database connection helper - Factory Pattern
 * Creates and returns a new database connection
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
 * Authorization helper - Strategy Pattern
 * Verifies JWT token from authorization header
 */
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
 * GET handler for course details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  console.log("Course API called with params:", params);
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    
    if (!decoded) {
      console.log("Authentication failed, no valid token");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log("User authenticated:", decoded.userId, decoded.role);

    // Validate courseId parameter
    const courseId = params.courseId;
    if (!courseId || isNaN(Number(courseId))) {
      console.log("Invalid courseId:", courseId);
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    // Establish database connection
    const connection = await getConnection();

    try {
      // First check if student is enrolled (for non-admin users)
      if (decoded.role !== 'admin') {
        console.log("Checking if user is enrolled in course");
        const [enrollments] = await connection.execute(
          `SELECT id FROM enrollments 
           WHERE student_id = ? AND course_id = ? AND status = 'active'`,
          [decoded.userId, courseId]
        );

        // If not enrolled and not an admin, deny access
        if (Array.isArray(enrollments) && enrollments.length === 0) {
          console.log("User not enrolled in course and not admin");
          return NextResponse.json(
            { error: 'You are not enrolled in this course' },
            { status: 403 }
          );
        }
      }
      
      // Get course details
      const [courseRows] = await connection.execute(
        `SELECT c.id, c.title, c.description, c.thumbnail, c.start_date, c.end_date, 
                c.status, c.difficulty_level, s.name as school_name,
                u.full_name as teacher_name
         FROM courses c
         LEFT JOIN schools s ON c.school_id = s.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [courseId]
      );

      if (!Array.isArray(courseRows) || courseRows.length === 0) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }

      // Get the course data without progress calculation
      const courseData = courseRows[0];

      return NextResponse.json(courseData);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: 'Database error occurred', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error in course API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}