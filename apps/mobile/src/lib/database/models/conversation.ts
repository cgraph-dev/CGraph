/**
 * WatermelonDB Conversation model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, children, lazy } from '@nozbe/watermelondb/decorators';

/**
 *
 */
export default class Conversation extends Model {
  static table = 'conversations';

  static associations = {
    messages: { type: 'has_many' as const, foreignKey: 'conversation_id' },
    conversation_participants: { type: 'has_many' as const, foreignKey: 'conversation_id' },
  };

  @text('server_id') serverId!: string | null;
  @text('type') type!: 'direct' | 'group';
  @text('name') name!: string | null;
  @text('avatar_url') avatarUrl!: string | null;
  @text('last_message_content') lastMessageContent!: string | null;
  @field('last_message_at') lastMessageAt!: number | null;
  @text('last_message_sender_id') lastMessageSenderId!: string | null;
  @field('unread_count') unreadCount!: number;
  @field('is_muted') isMuted!: boolean;
  @field('is_pinned') isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @text('encryption_key_id') encryptionKeyId!: string | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @children('messages') messages!: Model[];
  @children('conversation_participants') participants!: Model[];

  /** Most recent messages, lazily loaded */
  @lazy recentMessages = this.messages;
}
