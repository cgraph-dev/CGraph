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
import type { Model } from '@nozbe/watermelondb';
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

// ─── Write Path ─────────────────────────────────────────────────

/** Helper: convert chatStore ISO timestamp to epoch ms for WatermelonDB */
function toEpoch(isoOrUndefined: string | undefined | null): number {
  if (!isoOrUndefined) return Date.now();
  const ts = new Date(isoOrUndefined).getTime();
  return Number.isNaN(ts) ? Date.now() : ts;
}

/** Helper: apply chatStore message fields to a WatermelonDB record's _raw */
function applyMessageToRaw(
  raw: Record<string, unknown>,
  message: Message,
  isCreate: boolean
): void {
  if (isCreate) {
    raw.id = message.id;
    raw.server_id = message.id;
    raw.conversation_id = message.conversationId;
    raw.channel_id = null;
    raw.sender_id = message.senderId;
    raw.message_type = message.messageType || 'text';
    raw.reply_to_id = message.replyToId;
    raw.attachments_json = JSON.stringify([]);
    raw.created_at = toEpoch(message.createdAt);
  }
  raw.content = message.content;
  raw.status = message.status || 'sent';
  raw.is_edited = message.isEdited;
  raw.is_deleted = !!message.deletedAt;
  raw.is_pinned = message.isPinned;
  raw.is_optimistic = message.isOptimistic ?? false;
  raw.encrypted_content = message.encryptedContent;
  raw.reactions_json = JSON.stringify(message.reactions || []);
  raw.metadata_json = JSON.stringify(message.metadata || {});
  raw.updated_at = toEpoch(message.updatedAt);
}

/**
 * Upsert a single chatStore Message into WatermelonDB.
 * Finds existing record by id — updates if found, creates if not.
 */
export async function saveMessageLocally(message: Message): Promise<void> {
  try {
    await database.write(async () => {
      let existing: Model | null = null;
      try {
        existing = await messagesCollection.find(message.id);
      } catch {
        // Record not found — will create
      }

      if (existing) {
        await existing.update(() => {
          applyMessageToRaw(existing!._raw as unknown as Record<string, unknown>, message, false);
        });
      } else {
        await messagesCollection.create((record) => {
          applyMessageToRaw(record._raw as unknown as Record<string, unknown>, message, true);
        });
      }
    });
  } catch (error) {
    console.warn('[messageBridge] saveMessageLocally failed:', error);
  }
}

/**
 * Mark a message as deleted in WatermelonDB.
 */
export async function markMessageDeletedLocally(messageId: string): Promise<void> {
  try {
    await database.write(async () => {
      const record = await messagesCollection.find(messageId);
      await record.update(() => {
        const raw = record._raw as unknown as Record<string, unknown>;
        raw.is_deleted = true;
        raw.content = '';
        raw.updated_at = Date.now();
      });
    });
  } catch (error) {
    console.warn('[messageBridge] markMessageDeletedLocally failed:', error);
  }
}

/**
 * Mark a message as edited in WatermelonDB and update its content.
 */
export async function markMessageEditedLocally(
  messageId: string,
  content: string
): Promise<void> {
  try {
    await database.write(async () => {
      const record = await messagesCollection.find(messageId);
      await record.update(() => {
        const raw = record._raw as unknown as Record<string, unknown>;
        raw.content = content;
        raw.is_edited = true;
        raw.updated_at = Date.now();
      });
    });
  } catch (error) {
    console.warn('[messageBridge] markMessageEditedLocally failed:', error);
  }
}

/**
 * Batch-write multiple chatStore Messages into WatermelonDB.
 * Uses database.batch() for efficiency.
 */
export async function saveMessagesLocally(messages: Message[]): Promise<void> {
  if (messages.length === 0) return;

  try {
    await database.write(async () => {
      const batchOps: Model[] = [];

      for (const message of messages) {
        let existing: Model | null = null;
        try {
          existing = await messagesCollection.find(message.id);
        } catch {
          // Not found — will create
        }

        if (existing) {
          const existingRef = existing;
          batchOps.push(
            existingRef.prepareUpdate(() => {
              applyMessageToRaw(
                existingRef._raw as unknown as Record<string, unknown>,
                message,
                false
              );
            })
          );
        } else {
          batchOps.push(
            messagesCollection.prepareCreate((record) => {
              applyMessageToRaw(
                record._raw as unknown as Record<string, unknown>,
                message,
                true
              );
            })
          );
        }
      }

      if (batchOps.length > 0) {
        await database.batch(...batchOps);
      }
    });
  } catch (error) {
    console.warn('[messageBridge] saveMessagesLocally failed:', error);
  }
}
