/**
 * WatermelonDB User model — local cache of contact/profile data.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  @text('server_id') serverId!: string | null;
  @text('email') email!: string | null;
  @text('username') username!: string;
  @text('uid') uid!: string | null;
  @text('display_name') displayName!: string;
  @text('avatar_url') avatarUrl!: string | null;
  @text('bio') bio!: string | null;
  @text('status') status!: 'online' | 'offline' | 'away' | 'dnd' | null;
  @text('status_message') statusMessage!: string | null;
  @field('karma') karma!: number;
  @field('is_verified') isVerified!: boolean;
  @field('is_premium') isPremium!: boolean;
  @text('tier') tier!: 'free' | 'premium' | 'enterprise';
  @text('title') title!: string | null;
  @text('title_rarity') titleRarity!: string | null;
  @field('last_seen_at') lastSeenAt!: number | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
