/**
 * User Validation Schemas
 *
 * Schemas for user references and full user profiles.
 *
 * @module validation/schemas/user
 */

import { z } from 'zod';
import { dateTimeSchema, uuidSchema, emailSchema } from './base';

// ============================================================================
// User Schemas
// ============================================================================

/**
 * User status enum
 */
export const userStatusSchema = z.enum(['online', 'idle', 'dnd', 'offline']);

/**
 * Base user schema for embedded user references
 */
export const userRefSchema = z.object({
  id: uuidSchema,
  username: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  avatarBorderId: z.string().nullable().optional(),
});

/**
 * Full user schema from /api/v1/me
 */
export const userSchema = z.object({
  id: uuidSchema,
  uid: z.string().optional(),
  user_id: z.number().int().optional(),
  user_id_display: z.string().optional(),
  email: emailSchema,
  username: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  wallet_address: z.string().nullable().optional(),
  email_verified_at: dateTimeSchema.nullable().optional(),
  totp_enabled: z.boolean().optional(),
  status: userStatusSchema.optional(),
  custom_status: z.string().nullable().optional(),
  karma: z.number().int().optional(),
  is_verified: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  is_admin: z.boolean().optional(),
  can_change_username: z.boolean().optional(),
  username_next_change_at: dateTimeSchema.nullable().optional(),
  inserted_at: dateTimeSchema.optional(),
  // Gamification fields
  level: z.number().int().optional(),
  xp: z.number().int().optional(),
  coins: z.number().int().optional(),
  title: z.string().optional(),
  title_color: z.string().optional(),
  badges: z.array(z.string()).optional(),
  streak: z.number().int().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type UserRef = z.infer<typeof userRefSchema>;
