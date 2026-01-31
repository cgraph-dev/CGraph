/**
 * API Response Validation with Zod
 *
 * Provides runtime type validation for API responses to catch backend
 * contract changes early and provide better error messages.
 *
 * @module apiValidation
 */

import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Validation');

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
// Conversation Schemas
// ============================================================================

/**
 * Conversation participant
 */
export const participantSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  role: z.enum(['owner', 'admin', 'member']).optional(),
  joined_at: dateTimeSchema.optional(),
  user: userRefSchema.optional(),
});

/**
 * Reaction on a message
 */
export const reactionSchema = z.object({
  id: uuidSchema,
  emoji: z.string(),
  user_id: uuidSchema,
  user: z
    .object({
      id: uuidSchema,
      username: z.string(),
    })
    .optional(),
});

/**
 * Message schema
 */
export const messageSchema = z.object({
  id: uuidSchema,
  conversation_id: uuidSchema,
  sender_id: uuidSchema,
  content: z.string().nullable(),
  encrypted_content: z.string().nullable().optional(),
  is_encrypted: z.boolean().optional(),
  message_type: z
    .enum(['text', 'image', 'video', 'file', 'audio', 'voice', 'sticker', 'gif', 'system'])
    .optional(),
  reply_to_id: uuidSchema.nullable().optional(),
  is_pinned: z.boolean().optional(),
  is_edited: z.boolean().optional(),
  deleted_at: dateTimeSchema.nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  reactions: z.array(reactionSchema).optional(),
  sender: userRefSchema.optional(),
  inserted_at: dateTimeSchema.optional(),
  updated_at: dateTimeSchema.optional(),
  // E2EE fields
  ephemeral_public_key: z.string().optional(),
  nonce: z.string().optional(),
  sender_identity_key: z.string().optional(),
});

/**
 * Conversation schema
 */
export const conversationSchema = z.object({
  id: uuidSchema,
  type: z.enum(['direct', 'group']),
  name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  participants: z.array(participantSchema).optional(),
  last_message: messageSchema.nullable().optional(),
  unread_count: z.number().int().nonnegative().optional(),
  inserted_at: dateTimeSchema.optional(),
  updated_at: dateTimeSchema.optional(),
});

/**
 * Conversations list response
 */
export const conversationsListSchema = z
  .object({
    conversations: z.array(conversationSchema).optional(),
    data: z.array(conversationSchema).optional(),
  })
  .or(z.array(conversationSchema));

/**
 * Messages list response
 */
export const messagesListSchema = z
  .object({
    messages: z.array(messageSchema).optional(),
    data: z.array(messageSchema).optional(),
    meta: paginationSchema.optional(),
  })
  .or(z.array(messageSchema));

// ============================================================================
// Notification Schemas
// ============================================================================

/**
 * Notification type enum
 */
export const notificationTypeSchema = z.enum([
  'message',
  'friend_request',
  'group_invite',
  'mention',
  'forum_reply',
  'system',
]);

/**
 * Notification schema
 */
export const notificationSchema = z.object({
  id: uuidSchema,
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  is_read: z.boolean(),
  data: z.record(z.unknown()).optional(),
  sender: userRefSchema.optional(),
  inserted_at: dateTimeSchema.optional(),
});

/**
 * Notifications list response
 */
export const notificationsListSchema = z
  .object({
    notifications: z.array(notificationSchema).optional(),
    data: z.array(notificationSchema).optional(),
    meta: z
      .object({
        unread_count: z.number().int().nonnegative().optional(),
      })
      .merge(paginationSchema)
      .optional(),
  })
  .or(z.array(notificationSchema));

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

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type UserRef = z.infer<typeof userRefSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type Friend = z.infer<typeof friendSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
