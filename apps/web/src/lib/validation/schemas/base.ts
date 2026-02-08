/**
 * Base Validation Schemas
 *
 * Foundational schemas reused across all domain schemas:
 * date-time, UUID, email, and pagination.
 *
 * @module validation/schemas/base
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

/**
 * ISO 8601 date-time string validation
 */
export const dateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));

/**
 * UUID v4 validation
 */
export const uuidSchema = z.string().uuid();

/**
 * Email validation
 */
export const emailSchema = z.string().email();

/**
 * Pagination metadata from API responses
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
  total_pages: z.number().int().nonnegative().optional(),
  has_more: z.boolean().optional(),
});
