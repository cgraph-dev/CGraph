/**
 * useOfflineQueue Hook
 *
 * React hook for interacting with the offline queue system.
 * Provides reactive state and methods for queue management.
 *
 * @module hooks/useOfflineQueue
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import {
  enqueue,
  dequeue,
  getQueue,
  getFailedItems,
  getStats,
  clearQueue,
  retryFailedItems,
  subscribe,
  QueueItem,
  QueueItemType,
  QueuePriority,
} from '../lib/offline/offline-queue';
import { createLogger } from '../lib/logger';

const logger = createLogger('useOfflineQueue');

export interface UseOfflineQueueReturn {
  // State
  queue: QueueItem[];
  failedItems: QueueItem[];
  pendingCount: number;
  failedCount: number;
  isProcessing: boolean;
  isOnline: boolean;
  lastSyncAt: Date | null;

  // Computed
  hasPendingItems: boolean;
  hasFailedItems: boolean;

  // Actions
  addToQueue: <T = unknown>(
    type: QueueItemType,
    endpoint: string,
    method: QueueItem['method'],
    payload: T,
    options?: {
      priority?: QueuePriority;
      metadata?: QueueItem['metadata'];
    }
  ) => Promise<QueueItem<T>>;
  removeFromQueue: (itemId: string) => Promise<boolean>;
  retryFailed: () => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => void;

  // Convenience methods
  queueMessage: (
    conversationId: string,
    content: string,
    metadata?: Record<string, unknown>
  ) => Promise<QueueItem>;
  queueReaction: (messageId: string, emoji: string) => Promise<QueueItem>;
  queuePost: (forumId: string, title: string, content: string) => Promise<QueueItem>;
}

/**
 *
 */
export function useOfflineQueue(): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [failedItems, setFailedItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState(getStats());

  /**
   * Refresh queue state
   */
  const refresh = useCallback(() => {
    setQueue(getQueue());
    setFailedItems(getFailedItems());
    setStats(getStats());
  }, []);

  /**
   * Subscribe to queue events
   */
  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to all events
    const unsubscribers = [
      subscribe('itemAdded', refresh),
      subscribe('itemProcessed', refresh),
      subscribe('itemFailed', refresh),
      subscribe('syncComplete', refresh),
      subscribe('networkChange', (data) => {
         
        const { isOnline } = data as { isOnline: boolean };
        setStats((prev) => ({ ...prev, isOnline }));

        // Haptic feedback on network change
        if (isOnline) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [refresh]);

  /**
   * Add item to queue
   */
  const addToQueue = useCallback(
    async <T = unknown>(
      type: QueueItemType,
      endpoint: string,
      method: QueueItem['method'],
      payload: T,
      options?: {
        priority?: QueuePriority;
        metadata?: QueueItem['metadata'];
      }
    ): Promise<QueueItem<T>> => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const item = await enqueue(type, endpoint, method, payload, options);
      logger.info('Item added to queue', { id: item.id, type });
      return item;
    },
    []
  );

  /**
   * Remove item from queue
   */
  const removeFromQueue = useCallback(
    async (itemId: string): Promise<boolean> => {
      const success = await dequeue(itemId);
      if (success) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        refresh();
      }
      return success;
    },
    [refresh]
  );

  /**
   * Retry failed items
   */
  const retryFailed = useCallback(async (): Promise<void> => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await retryFailedItems();
    refresh();
  }, [refresh]);

  /**
   * Clear entire queue
   */
  const clear = useCallback(async (): Promise<void> => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await clearQueue();
    refresh();
  }, [refresh]);

  /**
   * Convenience: Queue a message
   */
  const queueMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      metadata?: Record<string, unknown>
    ): Promise<QueueItem> => {
      const clientMessageId = Crypto.randomUUID();
      return addToQueue(
        'message',
        `/api/v1/conversations/${conversationId}/messages`,
        'POST',
        { content, client_message_id: clientMessageId },
        {
          priority: QueuePriority.CRITICAL,
          metadata: {
            description: `Message to conversation ${conversationId}`,
            conversationId,
            clientMessageId,
            ...metadata,
          },
        }
      );
    },
    [addToQueue]
  );

  /**
   * Convenience: Queue a reaction
   */
  const queueReaction = useCallback(
    async (messageId: string, emoji: string): Promise<QueueItem> => {
      return addToQueue(
        'reaction',
        `/api/v1/messages/${messageId}/reactions`,
        'POST',
        { emoji },
        {
          priority: QueuePriority.HIGH,
          metadata: {
            description: `React ${emoji} to message`,
            messageId,
          },
        }
      );
    },
    [addToQueue]
  );

  /**
   * Convenience: Queue a forum post
   */
  const queuePost = useCallback(
    async (forumId: string, title: string, content: string): Promise<QueueItem> => {
      return addToQueue(
        'post',
        `/api/v1/forums/${forumId}/posts`,
        'POST',
        { title, content },
        {
          priority: QueuePriority.NORMAL,
          metadata: {
            description: `Post: ${title}`,
            forumId,
          },
        }
      );
    },
    [addToQueue]
  );

  // Computed values
  const hasPendingItems = queue.length > 0;
  const hasFailedItems = failedItems.length > 0;
  const lastSyncAt = useMemo(
    () => (stats.lastSyncAt ? new Date(stats.lastSyncAt) : null),
    [stats.lastSyncAt]
  );

  return {
    // State
    queue,
    failedItems,
    pendingCount: stats.pending,
    failedCount: stats.failed,
    isProcessing: stats.isProcessing,
    isOnline: stats.isOnline,
    lastSyncAt,

    // Computed
    hasPendingItems,
    hasFailedItems,

    // Actions
    addToQueue,
    removeFromQueue,
    retryFailed,
    clear,
    refresh,

    // Convenience methods
    queueMessage,
    queueReaction,
    queuePost,
  };
}

export default useOfflineQueue;
