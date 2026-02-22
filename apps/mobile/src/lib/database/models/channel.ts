/**
 * WatermelonDB Channel model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, relation } from '@nozbe/watermelondb/decorators';

export default class Channel extends Model {
  static table = 'channels';

  static associations = {
    groups: { type: 'belongs_to' as const, key: 'group_id' },
    messages: { type: 'has_many' as const, foreignKey: 'channel_id' },
  };

  @text('server_id') serverId!: string | null;
  @text('group_id') groupId!: string;
  @text('category_id') categoryId!: string | null;
  @text('name') name!: string;
  @text('type') type!: 'text' | 'voice' | 'announcements' | 'stage';
  @text('topic') topic!: string | null;
  @field('position') position!: number;
  @field('is_private') isPrivate!: boolean;
  @field('is_nsfw') isNsfw!: boolean;
  @field('slow_mode_seconds') slowModeSeconds!: number;
  @field('unread_count') unreadCount!: number;
  @field('last_message_at') lastMessageAt!: number | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @relation('groups', 'group_id') group!: Model;
}
