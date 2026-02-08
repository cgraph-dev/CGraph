/**
 * Notification Validation Schemas
 *
 * Schemas for notification types and notification list responses.
 *
 * @module validation/schemas/notification
 */

import { z } from 'zod';
import { dateTimeSchema, uuidSchema, paginationSchema } from './base';
import { userRefSchema } from './user';

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
// Type Exports
// ============================================================================

export type Notification = z.infer<typeof notificationSchema>;
