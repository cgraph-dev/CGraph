/**
 * API Type Guards
 *
 * Type guard utilities for validating API response values.
 */

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid ID (non-empty string or number)
 */
export function isValidId(value: unknown): value is string | number {
  return (
    (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'number' && !isNaN(value))
  );
}
