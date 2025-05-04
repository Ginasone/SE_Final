/**
 * Request Validator Utility
 * 
 * Implements validation logic for API requests.
 * Uses the Strategy pattern to apply different validation rules
 * based on the validation schema provided.
 * 
 * @author Nadia
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Validate request object against a Zod schema
 * 
 * @param {any} data - The data to validate
 * @param {z.ZodType} schema - Zod schema to validate against
 * @returns {ValidationResult} Validation result with parsed data or errors
 */
export function validateData(data: any, schema: z.ZodType): ValidationResult {
  try {
    // Attempt to parse and validate the data
    const validatedData = schema.parse(data);
    
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      // Format error messages by field
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        
        formattedErrors[field].push(err.message);
      });
      
      return {
        success: false,
        errors: formattedErrors
      };
    }
    
    // Handle unexpected errors
    return {
      success: false,
      errors: {
        _general: ['An unexpected validation error occurred']
      }
    };
  }
}

/**
 * Validate complete HTTP request against a schema
 * This is a higher-level wrapper for validateData, specifically for Request objects
 * 
 * @param {Request} req - The HTTP request
 * @param {z.ZodType} bodySchema - Schema for the request body
 * @param {z.ZodType} querySchema - Optional schema for query parameters
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateRequest(
  req: Request,
  bodySchema?: z.ZodType,
  querySchema?: z.ZodType
): Promise<ValidationResult> {
  try {
    // Validate body if schema provided
    if (bodySchema) {
      try {
        const body = await req.json();
        const bodyValidation = validateData(body, bodySchema);
        
        if (!bodyValidation.success) {
          return bodyValidation;
        }
      } catch (error) {
        return {
          success: false,
          errors: {
            body: ['Invalid JSON in request body']
          }
        };
      }
    }
    
    // Validate query parameters if schema provided
    if (querySchema) {
      const url = new URL(req.url);
      const queryParams: Record<string, string> = {};
      
      // Convert URLSearchParams to plain object
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      
      const queryValidation = validateData(queryParams, querySchema);
      
      if (!queryValidation.success) {
        return queryValidation;
      }
    }
    
    // All validations passed
    return { success: true };
  } catch (error) {
    console.error('Error in request validation:', error);
    
    return {
      success: false,
      errors: {
        _general: ['Request validation failed']
      }
    };
  }
}

// Export common validation schemas
export const Schemas = {
  id: z.number().int().positive(),
  email: z.string().email(),
  password: z.string().min(8),
  studentId: z.number().int().positive(),
  limit: z.number().int().min(1).max(50).default(10),
  notificationId: z.number().int().positive()
};