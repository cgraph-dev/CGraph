/**
 * WatermelonDB OfflineQueueItem model — persisted pending REST operations.
 *
 * Replaces the previous AsyncStorage-based OfflineQueue with SQLite-backed
 * persistence while preserving the same priority/retry/backoff semantics.
 */
import { Model } from '@nozbe/watermelondb';
import { field, text, json } from '@nozbe/watermelondb/decorators';

const sanitize = (raw: unknown) => {
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
export default class OfflineQueueItem extends Model {
  static table = 'offline_queue';

  @text('operation_type') operationType!: string;
  @field('priority') priority!: number;
  @text('endpoint') endpoint!: string;
  @text('method') method!: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  @json('payload_json', sanitize) payload!: Record<string, unknown>;
  @json('headers_json', sanitize) headers!: Record<string, string> | null;
  @field('retry_count') retryCount!: number;
  @field('max_retries') maxRetries!: number;
  @text('last_error') lastError!: string | null;
  @text('status') status!: 'pending' | 'processing' | 'failed' | 'completed';
  @json('metadata_json', sanitize) metadata!: Record<string, unknown> | null;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
