/**
 * Conversation & Message Validation Schemas
 *
 * Schemas for conversations, participants, messages, and reactions.
 *
 * @module validation/schemas/conversation
 */

import { z } from 'zod';
import { dateTimeSchema, uuidSchema, paginationSchema } from './base';
import { userRefSchema } from './user';

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
// Type Exports
// ============================================================================

export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
