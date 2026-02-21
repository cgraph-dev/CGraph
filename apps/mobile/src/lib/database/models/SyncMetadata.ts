/**
 * WatermelonDB SyncMetadata model — tracks per-table sync timestamps.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class SyncMetadata extends Model {
  static table = 'sync_metadata';

  @text('table_name') tableName!: string;
  @field('last_pulled_at') lastPulledAt!: number;
  @field('last_pushed_at') lastPushedAt!: number;
  @text('pull_cursor') pullCursor!: string | null;
  @text('status') status!: 'idle' | 'pulling' | 'pushing' | 'error';
  @text('error_message') errorMessage!: string | null;
}
