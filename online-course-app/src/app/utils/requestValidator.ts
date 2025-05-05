/**
 * Request Validator Utility
 * 
 * Implements validation logic for API requests.
 * Uses the Strategy pattern to apply different validation rules.
 * 
 * @author Nadia
 * @version 1.0.0
 */

// Define validator types
type ValidationRule = (value: unknown) => boolean;
type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  data?: unknown;
  errors?: Record<string, string[]>;
}

/**
 * Validate data against a schema
 * 
 * @param {unknown} data - The data to validate
 * @param {ValidationSchema} schema - Schema to validate against
 * @returns {ValidationResult} Validation result with validated data or errors
 */
export function validateData(data: unknown, schema: ValidationSchema): ValidationResult {
  try {
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        errors: {
          _general: ['Data must be an object']
        }
      };
    }

    const dataObj = data as Record<string, unknown>;
    const errors: Record<string, string[]> = {};
    
    // Validate each field against its rule
    for (const [field, rule] of Object.entries(schema)) {
      if (!rule(dataObj[field])) {
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(`Invalid value for ${field}`);
      }
    }
    
    // Check if any errors were found
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        errors
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    // Using console.error to actually use the error variable
    console.error("Validation error:", error);
    return {
      success: false,
      errors: {
        _general: ['An unexpected validation error occurred']
      }
    };
  }
}

/**
 * Validate complete HTTP request
 * 
 * @param {Request} req - The HTTP request
 * @param {ValidationSchema} bodySchema - Schema for the request body
 * @param {ValidationSchema} querySchema - Optional schema for query parameters
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateRequest(
  req: Request,
  bodySchema?: ValidationSchema,
  querySchema?: ValidationSchema
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
        // Using console.error to actually use the error variable
        console.error("JSON parsing error:", error);
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
    // Using the error for logging, so it's not unused
    console.error('Error in request validation:', error);
    
    return {
      success: false,
      errors: {
        _general: ['Request validation failed']
      }
    };
  }
}

// Basic validation rules
export const Validators = {
  isRequired: (value: unknown): boolean => value !== undefined && value !== null && value !== '',
  isEmail: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    // Simple email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  isNumber: (value: unknown): boolean => typeof value === 'number' && !isNaN(value),
  isString: (value: unknown): boolean => typeof value === 'string',
  minLength: (min: number) => (value: unknown): boolean => 
    typeof value === 'string' && value.length >= min,
  maxLength: (max: number) => (value: unknown): boolean => 
    typeof value === 'string' && value.length <= max,
  isInt: (value: unknown): boolean => 
    typeof value === 'number' && Number.isInteger(value),
  min: (min: number) => (value: unknown): boolean => 
    typeof value === 'number' && value >= min,
  max: (max: number) => (value: unknown): boolean => 
    typeof value === 'number' && value <= max
};