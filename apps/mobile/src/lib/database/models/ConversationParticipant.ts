/**
 * WatermelonDB ConversationParticipant model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

export default class ConversationParticipant extends Model {
  static table = 'conversation_participants';

  static associations = {
    conversations: { type: 'belongs_to' as const, key: 'conversation_id' },
  };

  @text('server_id') serverId!: string | null;
  @text('conversation_id') conversationId!: string;
  @text('user_id') userId!: string;
  @text('role') role!: 'owner' | 'admin' | 'member';
  @field('joined_at') joinedAt!: number;
  @field('last_read_at') lastReadAt!: number | null;

  @relation('conversations', 'conversation_id') conversation!: Model;
}
