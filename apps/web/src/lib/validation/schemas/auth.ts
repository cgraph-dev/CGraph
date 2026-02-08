/**
 * Auth Validation Schemas
 *
 * Schemas for authentication responses: tokens, login, register, refresh.
 *
 * @module validation/schemas/auth
 */

import { z } from 'zod';
import { userSchema } from './user';

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Token pair from login/register/refresh
 */
export const tokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer').optional(),
  expires_in: z.number().int().optional(),
});

/**
 * Login response schema
 */
export const loginResponseSchema = z.object({
  user: userSchema,
  tokens: tokensSchema,
});

/**
 * Register response schema
 */
export const registerResponseSchema = loginResponseSchema;

/**
 * Refresh token response
 */
export const refreshResponseSchema = z.union([
  z.object({ tokens: tokensSchema }),
  tokensSchema, // Some endpoints return tokens directly
]);

// ============================================================================
// Type Exports
// ============================================================================

export type Tokens = z.infer<typeof tokensSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
