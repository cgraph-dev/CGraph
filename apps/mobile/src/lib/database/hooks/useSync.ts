/**
 * useSync — React hook for WatermelonDB sync state.
 *
 * Provides sync status, manual trigger, and offline queue stats
 * for use in UI indicators (sync badge, offline banner, etc.).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { offlineQueueCollection } from '../index';
import { sync, processOfflineQueue, SyncStats } from '../sync';

export interface UseSyncState {
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Last successful sync stats */
  lastSync: SyncStats | null;
  /** Number of pending offline queue items */
  pendingQueueCount: number;
  /** Number of failed offline queue items */
  failedQueueCount: number;
  /** Trigger a manual sync */
  triggerSync: () => Promise<void>;
  /** Retry failed queue items */
  retryFailed: () => Promise<void>;
}

export function useSync(): UseSyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncStats | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [failedQueueCount, setFailedQueueCount] = useState(0);
  const isMounted = useRef(true);

  // Observe queue counts
  useEffect(() => {
    isMounted.current = true;

    const pendingSub = offlineQueueCollection
      .query(Q.where('status', Q.oneOf(['pending', 'processing'])))
      .observeCount()
      .subscribe((count) => {
        if (isMounted.current) setPendingQueueCount(count);
      });

    const failedSub = offlineQueueCollection
      .query(Q.where('status', 'failed'))
      .observeCount()
      .subscribe((count) => {
        if (isMounted.current) setFailedQueueCount(count);
      });

    return () => {
      isMounted.current = false;
      pendingSub.unsubscribe();
      failedSub.unsubscribe();
    };
  }, []);

  // Sync on app foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        sync().then((stats) => {
          if (stats && isMounted.current) setLastSync(stats);
        });
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const stats = await sync(true);
      if (stats && isMounted.current) setLastSync(stats);
      await processOfflineQueue();
    } finally {
      if (isMounted.current) setIsSyncing(false);
    }
  }, []);

  const retryFailed = useCallback(async () => {
    // Reset failed items to pending
    const failedItems = await offlineQueueCollection.query(Q.where('status', 'failed')).fetch();

    if (failedItems.length > 0) {
      const { database } = await import('../index');
      await database.write(async () => {
        for (const item of failedItems) {
          await item.update((record) => {
            record.status = 'pending';
            record.retryCount = 0;
          });
        }
      });
      await processOfflineQueue();
    }
  }, []);

  return {
    isSyncing,
    lastSync,
    pendingQueueCount,
    failedQueueCount,
    triggerSync,
    retryFailed,
  };
}
