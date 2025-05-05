/**
 * Error Handler Utility
 * 
 * Provides standardized error handling for the application.
 * Implements the Error Handler pattern to centralize error management.
 * 
 * Design Pattern: Error Handler Pattern
 * 
 * @author Nadia
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Common API error codes
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

// Common predefined API errors for consistency
export const Errors = {
  badRequest: (message: string = 'Bad request') => 
    new ApiError(message, 400, ErrorCodes.BAD_REQUEST),
    
  unauthorized: (message: string = 'Unauthorized') => 
    new ApiError(message, 401, ErrorCodes.UNAUTHORIZED),
    
  forbidden: (message: string = 'Forbidden') => 
    new ApiError(message, 403, ErrorCodes.FORBIDDEN),
    
  notFound: (message: string = 'Resource not found') => 
    new ApiError(message, 404, ErrorCodes.NOT_FOUND),
    
  validation: (message: string = 'Validation error') => 
    new ApiError(message, 422, ErrorCodes.VALIDATION_ERROR),
    
  rateLimit: (message: string = 'Rate limit exceeded') => 
    new ApiError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED),
    
  internal: (message: string = 'Internal server error') => 
    new ApiError(message, 500, ErrorCodes.INTERNAL_ERROR),
    
  database: (message: string = 'Database error') => 
    new ApiError(message, 500, ErrorCodes.DATABASE_ERROR),
    
  serviceUnavailable: (message: string = 'Service unavailable') => 
    new ApiError(message, 503, ErrorCodes.SERVICE_UNAVAILABLE)
};

/**
 * Handle API errors and convert them to NextResponse
 * This provides a consistent error response format
 * 
 * @param {unknown} error - The error to handle
 * @param {boolean} includeStack - Whether to include stack trace (dev only)
 * @returns {NextResponse} Formatted HTTP error response
 */
export function handleApiError(error: unknown, includeStack: boolean = false): NextResponse {
  console.error('API Error:', error);
  
  // Handle known API errors
  if (error instanceof ApiError) {
    const response = {
      error: {
        message: error.message,
        code: error.code
      }
    };
    
    // Only include stack trace in development
    if (includeStack && process.env.NODE_ENV !== 'production') {
      Object.assign(response.error, { stack: error.stack });
    }
    
    return NextResponse.json(response, { status: error.statusCode });
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    const response = {
      error: {
        message: error.message,
        code: ErrorCodes.INTERNAL_ERROR
      }
    };
    
    // Only include stack trace in development
    if (includeStack && process.env.NODE_ENV !== 'production') {
      Object.assign(response.error, { stack: error.stack });
    }
    
    return NextResponse.json(response, { status: 500 });
  }
  
  // Handle unknown error types
  return NextResponse.json({
    error: {
      message: 'An unexpected error occurred',
      code: ErrorCodes.INTERNAL_ERROR
    }
  }, { status: 500 });
}

/**
 * Log error details for monitoring and debugging
 * 
 * @param {unknown} error - The error to log
 * @param {Record<string, any>} context - Additional context information
 */
export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  // Basic console logging for development
  console.error('Error:', {
    error,
    context,
    timestamp: new Date().toISOString()
  });
}