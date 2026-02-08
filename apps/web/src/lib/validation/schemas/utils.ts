/**
 * Validation Utilities
 *
 * Runtime validation helpers for API responses with graceful fallback
 * and development-mode logging.
 *
 * @module validation/schemas/utils
 */

import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Validation');

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

/**
 * Validate data against a Zod schema
 * Returns the validated data or undefined if validation fails
 * Logs errors in development mode
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (import.meta.env.DEV) {
      logger.warn(
        `Schema validation failed${context ? ` - ${context}` : ''}:`,
        result.error.format()
      );
      logger.warn('Received data:', data);
    }
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

/**
 * Validate and return data, falling back to raw data if validation fails
 * Use this for graceful degradation when API returns unexpected data
 */
export function validateWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (import.meta.env.DEV) {
      logger.warn(
        `Using fallback data due to validation error${context ? ` - ${context}` : ''}:`,
        result.error.issues
      );
    }
    // Return raw data as-is, cast to expected type
    // This allows the app to continue working even with schema mismatches
    return data as T;
  }

  return result.data;
}

/**
 * Create a validated fetch wrapper
 */
export function createValidatedFetcher<T>(schema: z.ZodSchema<T>) {
  return (data: unknown, context?: string): T => {
    return validateWithFallback(schema, data, context);
  };
}
