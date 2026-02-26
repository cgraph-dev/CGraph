/**
 * WatermelonDB Message model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, relation, json } from '@nozbe/watermelondb/decorators';

const sanitizeJSON = (raw: unknown) => {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw ?? null;
};

/**
 *
 */
export default class Message extends Model {
  static table = 'messages';

  static associations = {
    conversations: { type: 'belongs_to' as const, key: 'conversation_id' },
  };

  @text('server_id') serverId!: string | null;
  @text('conversation_id') conversationId!: string;
  @text('channel_id') channelId!: string | null;
  @text('sender_id') senderId!: string;
  @text('content') content!: string;
  @text('encrypted_content') encryptedContent!: string | null;
  @text('message_type') messageType!: 'text' | 'image' | 'file' | 'system' | 'voice';
  @text('reply_to_id') replyToId!: string | null;
  @json('attachments_json', sanitizeJSON) attachments!: Record<string, unknown>[];
  @json('metadata_json', sanitizeJSON) metadata!: Record<string, unknown> | null;
  @json('reactions_json', sanitizeJSON) reactions!: Record<string, string[]> | null;
  @text('status') status!: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  @field('is_edited') isEdited!: boolean;
  @field('is_deleted') isDeleted!: boolean;
  @field('is_pinned') isPinned!: boolean;
  @field('is_optimistic') isOptimistic!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @relation('conversations', 'conversation_id') conversation!: Model;
}
