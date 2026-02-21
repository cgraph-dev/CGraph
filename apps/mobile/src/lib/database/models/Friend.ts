/**
 * WatermelonDB Friend model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Friend extends Model {
  static table = 'friends';

  @text('server_id') serverId!: string | null;
  @text('user_id') userId!: string;
  @text('friend_user_id') friendUserId!: string;
  @text('status') status!: 'pending' | 'accepted' | 'blocked';
  @text('direction') direction!: 'incoming' | 'outgoing' | 'mutual';
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
