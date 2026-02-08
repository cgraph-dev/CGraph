/**
 * Social & Group Validation Schemas
 *
 * Schemas for friends, friend requests, groups, channels, and API errors.
 *
 * @module validation/schemas/social
 */

import { z } from 'zod';
import { dateTimeSchema, uuidSchema } from './base';
import { userRefSchema } from './user';

// ============================================================================
// Friend Schemas
// ============================================================================

/**
 * Friend request status
 */
export const friendRequestStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'blocked']);

/**
 * Friend/Friend request schema
 */
export const friendSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  friend_id: uuidSchema,
  status: friendRequestStatusSchema,
  user: userRefSchema.optional(),
  friend: userRefSchema.optional(),
  inserted_at: dateTimeSchema.optional(),
});

// ============================================================================
// Group Schemas
// ============================================================================

/**
 * Group member role
 */
export const groupRoleSchema = z.enum(['owner', 'admin', 'moderator', 'member']);

/**
 * Group schema
 */
export const groupSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  is_private: z.boolean().optional(),
  member_count: z.number().int().nonnegative().optional(),
  owner_id: uuidSchema.optional(),
  inserted_at: dateTimeSchema.optional(),
  updated_at: dateTimeSchema.optional(),
});

/**
 * Channel schema
 */
export const channelSchema = z.object({
  id: uuidSchema,
  group_id: uuidSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.enum(['text', 'voice', 'announcement']).optional(),
  position: z.number().int().nonnegative().optional(),
  inserted_at: dateTimeSchema.optional(),
});

// ============================================================================
// Error Schemas
// ============================================================================

/**
 * API error response
 */
export const apiErrorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.array(z.string())).optional(),
  code: z.string().optional(),
  status: z.number().int().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Friend = z.infer<typeof friendSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
