/**
 * WatermelonDB ↔ ChatStore Message Bridge
 *
 * Bridges the WatermelonDB persistence layer with the Zustand chatStore.
 * WatermelonDB is the offline cache; Zustand remains the source of truth for UI.
 *
 * Read path:  WatermelonDB → chatStore Message format (instant offline display)
 * Write path: chatStore mutations → WatermelonDB persistence (fire-and-forget)
 *
 * @module lib/database/messageBridge
 * @since v0.9.32
 */
import { Q } from '@nozbe/watermelondb';
import { database, messagesCollection } from './index';
import type WMDBMessage from './models/message';
import type { Message, MessageSender } from '../../stores/chatStore';

// ─── Read Path ──────────────────────────────────────────────────

/**
 * Convert a WatermelonDB Message record to the chatStore Message interface.
 *
 * Key differences handled:
 *  - WatermelonDB `isDeleted` (boolean) → chatStore `deletedAt` (string | null)
 *  - WatermelonDB timestamps are epoch ms (number) → chatStore ISO strings
 *  - WatermelonDB has no sender relation → create minimal stub
 *  - WatermelonDB `reactions` is Record<string, string[]> → chatStore Reaction[]
 */
export function watermelonToMessage(record: WMDBMessage): Message {
  // Convert epoch ms to ISO string, handling 0/undefined gracefully
  const toISO = (ts: number | undefined | null): string =>
    ts ? new Date(ts).toISOString() : new Date().toISOString();

  // Build a minimal sender stub — WatermelonDB doesn't store sender details
  const senderStub: MessageSender = {
    id: record.senderId || '',
    username: '',
    displayName: null,
    avatarUrl: null,
  };

  // Convert WatermelonDB reactions (Record<emoji, userId[]>) to chatStore Reaction[]
  const reactions = record.reactions
    ? Object.entries(record.reactions).flatMap(([emoji, userIds]) =>
        (userIds || []).map((userId: string) => ({
          id: `${record.id}-${emoji}-${userId}`,
          emoji,
          userId,
          user: { id: userId, username: '' },
        }))
      )
    : [];

  return {
    id: record.id,
    conversationId: record.conversationId,
    senderId: record.senderId,
    content: record.content || '',
    messageType: (record.messageType || 'text') as Message['messageType'],
    replyToId: record.replyToId || null,
    replyTo: null, // WatermelonDB doesn't store nested reply objects
    isPinned: record.isPinned ?? false,
    isEdited: record.isEdited ?? false,
    isEncrypted: !!record.encryptedContent,
    encryptedContent: record.encryptedContent || null,
    deletedAt: record.isDeleted ? toISO(record.updatedAt) : null,
    metadata: record.metadata || {},
    reactions,
    sender: senderStub,
    createdAt: toISO(record.createdAt),
    updatedAt: toISO(record.updatedAt),
    status: record.status || undefined,
    isOptimistic: record.isOptimistic ?? false,
  };
}

/**
 * Load messages from WatermelonDB for a conversation.
 * Returns chatStore-compatible Message[] ordered newest-first, limited to 50.
 * Returns empty array if WatermelonDB is empty (fresh install).
 */
export async function getLocalMessages(conversationId: string): Promise<Message[]> {
  try {
    const records = await messagesCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.sortBy('created_at', Q.desc),
        Q.take(50)
      )
      .fetch();

    return records.map((r) => watermelonToMessage(r as unknown as WMDBMessage));
  } catch (error) {
    console.warn('[messageBridge] getLocalMessages failed:', error);
    return [];
  }
}
