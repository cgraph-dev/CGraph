/**
 * Data normalizers for API and WebSocket responses.
 * Handles both camelCase and snake_case field names for compatibility.
 * Mobile uses snake_case internally to match native conventions.
 */

import { Message, UserBasic } from '../types';

/**
 * Normalizes a message object from various sources (HTTP API, WebSocket).
 * Converts all formats to snake_case for mobile app compatibility.
 */
export function normalizeMessage(raw: Record<string, unknown>): Message {
  if (!raw || typeof raw !== 'object') {
    return raw as unknown as Message;
  }

  const sender = normalizeSender(raw.sender as Record<string, unknown> | null);
  const senderId = (raw.senderId ?? raw.sender_id ?? sender?.id ?? '') as string;
  
  return {
    id: raw.id as string,
    content: (raw.content ?? '') as string,
    type: (raw.type ?? raw.messageType ?? raw.message_type ?? raw.contentType ?? raw.content_type ?? 'text') as Message['type'],
    attachments: (raw.attachments ?? []) as Message['attachments'],
    metadata: raw.metadata as Message['metadata'],
    sender: sender,
    sender_id: senderId,
    conversation_id: (raw.conversationId ?? raw.conversation_id ?? null) as string | undefined,
    channel_id: (raw.channelId ?? raw.channel_id ?? null) as string | undefined,
    reply_to_id: (raw.replyToId ?? raw.reply_to_id ?? null) as string | undefined,
    reply_to: raw.replyTo ?? raw.reply_to ? normalizeMessage(raw.replyTo as Record<string, unknown> ?? raw.reply_to as Record<string, unknown>) : undefined,
    reactions: (raw.reactions ?? []) as Message['reactions'],
    is_edited: (raw.isEdited ?? raw.is_edited ?? false) as boolean,
    is_deleted: Boolean(raw.isDeleted ?? raw.is_deleted ?? raw.deletedAt ?? raw.deleted_at ?? false),
    inserted_at: (raw.createdAt ?? raw.created_at ?? raw.insertedAt ?? raw.inserted_at ?? new Date().toISOString()) as string,
    updated_at: (raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
  };
}

/**
 * Normalizes sender data from various formats.
 * Handles both camelCase (from WebSocket) and snake_case (from HTTP API).
 */
function normalizeSender(sender: Record<string, unknown> | null | undefined): UserBasic {
  if (!sender || typeof sender !== 'object') {
    return {
      id: '',
      username: null,
      display_name: null,
      avatar_url: null,
      status: 'offline',
    };
  }

  return {
    id: sender.id as string,
    username: (sender.username ?? null) as string | null,
    display_name: (sender.displayName ?? sender.display_name ?? null) as string | null,
    avatar_url: (sender.avatarUrl ?? sender.avatar_url ?? null) as string | null,
    status: (sender.status ?? 'offline') as string,
    karma: sender.karma as number | undefined,
    is_verified: Boolean(sender.isVerified ?? sender.is_verified ?? false) || undefined,
  };
}

/**
 * Normalizes an array of messages.
 */
export function normalizeMessages(messages: unknown[]): Message[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map((m) => normalizeMessage(m as Record<string, unknown>));
}
