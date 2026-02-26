/**
 * WatermelonDB Group model.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, children } from '@nozbe/watermelondb/decorators';

/**
 *
 */
export default class Group extends Model {
  static table = 'groups';

  static associations = {
    channels: { type: 'has_many' as const, foreignKey: 'group_id' },
  };

  @text('server_id') serverId!: string | null;
  @text('name') name!: string;
  @text('slug') slug!: string;
  @text('description') description!: string | null;
  @text('icon_url') iconUrl!: string | null;
  @text('banner_url') bannerUrl!: string | null;
  @text('owner_id') ownerId!: string;
  @field('is_public') isPublic!: boolean;
  @field('member_count') memberCount!: number;
  @field('online_member_count') onlineMemberCount!: number;
  @text('my_role') myRole!: string | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @children('channels') channels!: Model[];
}
