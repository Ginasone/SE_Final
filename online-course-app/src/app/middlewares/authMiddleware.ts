/**
 * Authentication Middleware
 * 
 * Implements JWT token verification for API route protection.
 * Uses the Chain of Responsibility pattern where the middleware
 * either proceeds with the request or returns an error.
 * 
 * @author Nadia
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT secret 
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User roles for role-based access control
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

// Token verification result interface
export interface AuthResult {
  isAuthenticated: boolean;
  user?: {
    id: number;
    role: string;
    schoolId?: number;
  };
  error?: string;
}

/**
 * Verify JWT authentication token from request headers
 * 
 * @param {NextRequest|Request} req - The HTTP request object
 * @returns {Promise<AuthResult>} Authentication result with user data if successful
 */
export async function verifyAuthToken(req: NextRequest | Request): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isAuthenticated: false,
        error: 'Authentication token is missing'
      };
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return {
        isAuthenticated: false,
        error: 'Invalid authentication token format'
      };
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      
      // Check if token is valid and has required user information
      if (!decoded || !decoded.userId || !decoded.role) {
        return {
          isAuthenticated: false,
          error: 'Invalid authentication token'
        };
      }
      
      // Return successful authentication with user data
      return {
        isAuthenticated: true,
        user: {
          id: decoded.userId,
          role: decoded.role,
          schoolId: decoded.schoolId
        }
      };
    } catch (jwtError) {
      // Handle different JWT verification errors
      if (jwtError instanceof jwt.TokenExpiredError) {
        return {
          isAuthenticated: false,
          error: 'Authentication token has expired'
        };
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return {
          isAuthenticated: false,
          error: 'Invalid authentication token'
        };
      }
      
      // Generic token verification error
      return {
        isAuthenticated: false,
        error: 'Authentication token verification failed'
      };
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication error'
    };
  }
}

/**
 * Check if user has required role
 * 
 * @param {string} userRole - The user's role
 * @param {string[]} allowedRoles - Array of roles that are allowed access
 * @returns {boolean} Whether the user has permission
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Verify if user can access specific student data
 * Implements authorization logic for student resources
 * 
 * @param {number} userId - The authenticated user's ID
 * @param {string} userRole - The user's role
 * @param {number} targetStudentId - The student ID being accessed
 * @returns {boolean} Whether access is permitted
 */
export function canAccessStudentData(
  userId: number,
  userRole: string,
  targetStudentId: number
): boolean {
  // Admins can access any student data
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Students can only access their own data
  if (userRole === UserRole.STUDENT) {
    return userId === targetStudentId;
  }
  
  // Teachers need additional checks (implemented in a real system)
  // This would check if the teacher teaches any of the student's courses
  if (userRole === UserRole.TEACHER) {
    // In a real implementation, this would query the database
    // to check if the teacher has any courses with this student enrolled
    return false; // Default to false without that check
  }
  
  // Default deny for any other role
  return false;
}