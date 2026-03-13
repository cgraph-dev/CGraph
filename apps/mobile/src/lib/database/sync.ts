/**
 * WatermelonDB Sync Engine — pull/push synchronization with the CGraph backend.
 *
 * Implements WatermelonDB's `synchronize()` protocol:
 *   - pullChanges: GET /api/v1/sync/pull?last_pulled_at=<timestamp>
 *   - pushChanges: POST /api/v1/sync/push
 *
 * Conflict resolution: server-wins (backend timestamp is authoritative).
 * Incorporates the existing OfflineQueue's priority/retry/backoff logic
 * for push operations that fail.
 *
 * @see https://watermelondb.dev/docs/Sync/Frontend
 */
import { synchronize, SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { database, offlineQueueCollection } from './index';
import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';

// ─── Configuration ──────────────────────────────────────────────

interface SyncConfig {
  apiBaseUrl: string;
  getAuthToken: () => Promise<string | null>;
  /** Tables to sync (subset of schema tables). Excludes offline_queue & sync_metadata. */
  syncTables: string[];
  /** Min ms between automatic syncs (default 30 000) */
  minSyncInterval: number;
  /** Called on sync errors */
  onError?: (error: Error) => void;
  /** Called on sync completion */
  onComplete?: (stats: SyncStats) => void;
}

export interface SyncStats {
  pulled: number;
  pushed: number;
  conflicts: number;
  durationMs: number;
  timestamp: number;
}

const DEFAULT_SYNC_TABLES = [
  'conversations',
  'conversation_participants',
  'messages',
  'users',
  'friends',
  'groups',
  'channels',
];

let config: SyncConfig = {
  apiBaseUrl: '',
  getAuthToken: async () => null,
  syncTables: DEFAULT_SYNC_TABLES,
  minSyncInterval: 30_000,
};

let lastSyncAt = 0;
let isSyncing = false;

/**
 * Configure sync engine.
 *
 */
export function configureSyncEngine(overrides: Partial<SyncConfig>): void {
  config = { ...config, ...overrides };
}

// ─── Main Sync ──────────────────────────────────────────────────

/**
 * Run a full pull + push sync cycle.
 * Safe to call frequently — debounces via minSyncInterval.
 */
export async function sync(force = false): Promise<SyncStats | null> {
  if (isSyncing) return null;

  const now = Date.now();
  if (!force && now - lastSyncAt < config.minSyncInterval) return null;

  // Check connectivity
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return null;

  const token = await config.getAuthToken();
  if (!token) return null;

  isSyncing = true;
  const startTime = Date.now();
  let pulled = 0;
  let pushed = 0;
  let conflicts = 0;

  try {
    await synchronize({
      database,
      sendCreatedAsUpdated: true,

      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const params = new URLSearchParams();
        if (lastPulledAt) params.set('last_pulled_at', String(lastPulledAt));
        params.set('schema_version', String(schemaVersion));
        if (migration) {
          params.set('migration_from', String(migration.from));
          params.set('migration_tables', migration.tables.join(','));
        }
        params.set('tables', config.syncTables.join(','));

        const response = await fetch(`${config.apiBaseUrl}/api/v1/sync/pull?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Pull failed: ${response.status} ${response.statusText}`);
        }

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const data = (await response.json()) as {
          changes: SyncDatabaseChangeSet;
          timestamp: number;
          conflicts?: number;
        };
        pulled = countChanges(data.changes);
        conflicts = data.conflicts ?? 0;

        return {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          changes: data.changes as SyncDatabaseChangeSet,
          timestamp: data.timestamp,
        };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        pushed = countChanges(changes);
        if (pushed === 0) return;

        const response = await fetch(`${config.apiBaseUrl}/api/v1/sync/push`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            changes,
            last_pulled_at: lastPulledAt,
          }),
        });

        if (!response.ok) {
          const err = await response.text().catch(() => 'Unknown error');
          throw new Error(`Push failed: ${response.status} — ${err}`);
        }
      },

      migrationsEnabledAtVersion: 1,
    });

    lastSyncAt = Date.now();
    const stats: SyncStats = {
      pulled,
      pushed,
      conflicts,
      durationMs: Date.now() - startTime,
      timestamp: lastSyncAt,
    };

    config.onComplete?.(stats);
    return stats;
  } catch (error) {
    config.onError?.(error instanceof Error ? error : new Error(String(error)));
    return null;
  } finally {
    isSyncing = false;
  }
}

// ─── Offline Queue Processing ───────────────────────────────────

/**
 * Process pending items in the offline_queue table.
 *
 * Preserves the original OfflineQueue's priority ordering and
 * exponential backoff with jitter, but uses WatermelonDB storage
 * instead of AsyncStorage.
 */
export async function processOfflineQueue(): Promise<number> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return 0;

  const token = await config.getAuthToken();
  if (!token) return 0;

  const pendingItems = await offlineQueueCollection
    .query(
      Q.where('status', Q.oneOf(['pending', 'failed'])),
      Q.sortBy('priority', Q.asc),
      Q.sortBy('created_at', Q.asc)
    )
    .fetch();

  let processed = 0;

  for (const item of pendingItems) {
    // Exponential backoff check
    if (item.retryCount > 0) {
      const backoff = calculateBackoff(item.retryCount);
      const elapsed = Date.now() - item.updatedAt;
      if (elapsed < backoff) continue;
    }

    // Mark as processing
    await database.write(async () => {
      await item.update((record) => {
        record.status = 'processing';
      });
    });

    try {
      const response = await fetch(`${config.apiBaseUrl}${item.endpoint}`, {
        method: item.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(item.headers ?? {}),
        },
        body: item.method !== 'GET' ? JSON.stringify(item.payload) : undefined,
      });

      if (response.ok) {
        await database.write(async () => {
          await item.update((record) => {
            record.status = 'completed';
          });
        });
        processed++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client error — don't retry
        const errText = await response.text().catch(() => '');
        await database.write(async () => {
          await item.update((record) => {
            record.status = 'failed';
            record.lastError = `${response.status}: ${errText}`.slice(0, 500);
          });
        });
      } else {
        // Server error — retry
        await database.write(async () => {
          await item.update((record) => {
            record.retryCount = item.retryCount + 1;
            record.lastError = `${response.status}`;
            record.status = item.retryCount + 1 >= item.maxRetries ? 'failed' : 'pending';
          });
        });
      }
    } catch (error) {
      await database.write(async () => {
        await item.update((record) => {
          record.retryCount = item.retryCount + 1;
          record.lastError = error instanceof Error ? error.message : String(error);
          record.status = item.retryCount + 1 >= item.maxRetries ? 'failed' : 'pending';
        });
      });
    }
  }

  // Clean up completed items older than 1 hour
  const oneHourAgo = Date.now() - 3_600_000;
  const completedItems = await offlineQueueCollection
    .query(Q.where('status', 'completed'), Q.where('updated_at', Q.lt(oneHourAgo)))
    .fetch();

  if (completedItems.length > 0) {
    await database.write(async () => {
      for (const item of completedItems) {
        await item.markAsDeleted();
      }
    });
  }

  return processed;
}

/**
 * Enqueue an operation for offline processing.
 * Called when a REST call fails due to network or when offline.
 */
export async function enqueueOfflineOperation(params: {
  operationType: string;
  priority?: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const now = Date.now();
  await database.write(async () => {
    await offlineQueueCollection.create((record) => {
      record.operationType = params.operationType;
      record.priority = params.priority ?? 3; // NORMAL
      record.endpoint = params.endpoint;
      record.method = params.method;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const raw = record._raw as Record<string, unknown>;
      raw.payload_json = JSON.stringify(params.payload ?? {});
      raw.headers_json = params.headers ? JSON.stringify(params.headers) : null;
      record.retryCount = 0;
      record.maxRetries = params.maxRetries ?? 5;
      record.lastError = null;
      record.status = 'pending';
      raw.metadata_json = params.metadata ? JSON.stringify(params.metadata) : null;
      raw.created_at = now;
      raw.updated_at = now;
    });
  });
}

// ─── Auto-Sync Manager ─────────────────────────────────────────

let syncInterval: ReturnType<typeof setInterval> | null = null;
let netInfoUnsubscribe: (() => void) | null = null;

/**
 * Start automatic background syncing:
 *   - Periodic interval (default 30s)
 *   - On network reconnect
 *   - Processes offline queue on each cycle
 */
export function startAutoSync(): void {
  stopAutoSync();

  // Periodic sync
  syncInterval = setInterval(async () => {
    await sync();
    await processOfflineQueue();
  }, config.minSyncInterval);

  // Sync on reconnect
  netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      await sync(true);
      await processOfflineQueue();
    }
  });

  // Initial sync
  sync(true).then(() => processOfflineQueue());
}

/**
 * Stop auto sync.
 *
 */
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function countChanges(
  changes: Record<string, { created?: unknown[]; updated?: unknown[]; deleted?: unknown[] }>
): number {
  let count = 0;
  for (const table of Object.values(changes)) {
    count += table.created?.length ?? 0;
    count += table.updated?.length ?? 0;
    count += table.deleted?.length ?? 0;
  }
  return count;
}

/**
 * Exponential backoff with jitter — same algorithm as the original OfflineQueue.
 * Base: 1s, max: 60s, jitter: ±25%
 */
function calculateBackoff(retryCount: number): number {
  const BASE_DELAY = 1_000;
  const MAX_DELAY = 60_000;
  const JITTER = 0.25;

  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  const jitter = delay * JITTER * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

// ─── React Integration Hooks ────────────────────────────────────

export { useSync } from './hooks/useSync';
