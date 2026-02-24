/**
 * useSubscriptions Hook
 *
 * Manages subscription data fetching, updates, and deletion.
 *
 * @module modules/forums/components/subscription-manager/useSubscriptions
 */

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { NotificationMode, Subscription, SubscriptionCounts } from './types';

const logger = createLogger('SubscriptionManager');

/**
 *
 */
export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchSubscriptions = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/api/forum/subscriptions', { signal });
        if (!signal.aborted) {
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('Failed to fetch subscriptions:', error);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSubscriptions();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      await api.patch(`/api/forum/subscriptions/${id}`, updates);
      setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)));
    } catch (error) {
      logger.error('Failed to update subscription:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await api.delete(`/api/forum/subscriptions/${id}`);
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (error) {
      logger.error('Failed to delete subscription:', error);
    }
  };

  const bulkUpdateMode = async (mode: NotificationMode) => {
    setBulkUpdating(true);
    try {
      await api.post('/api/forum/subscriptions/bulk-update', { notificationMode: mode });
      setSubscriptions((prev) => prev.map((sub) => ({ ...sub, notificationMode: mode })));
    } catch (error) {
      logger.error('Failed to bulk update:', error);
    } finally {
      setBulkUpdating(false);
    }
  };

  const getCounts = (subs: Subscription[]): SubscriptionCounts => ({
    all: subs.length,
    forum: subs.filter((s) => s.type === 'forum').length,
    board: subs.filter((s) => s.type === 'board').length,
    thread: subs.filter((s) => s.type === 'thread').length,
  });

  const totalUnread = subscriptions.reduce((acc, sub) => acc + sub.unreadCount, 0);
  const counts = getCounts(subscriptions);

  return {
    subscriptions,
    isLoading,
    bulkUpdating,
    counts,
    totalUnread,
    updateSubscription,
    deleteSubscription,
    bulkUpdateMode,
  };
}
