/**
 * Forum subscription hooks for managing thread/board/forum subscriptions
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useSubscription');

type SubscriptionType = 'forum' | 'board' | 'thread';
type NotificationMode = 'instant' | 'daily' | 'weekly' | 'none';

interface SubscriptionSettings {
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  includeReplies: boolean;
}

interface Subscription {
  id: string;
  type: SubscriptionType;
  targetId: string;
  targetName: string;
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  unreadCount: number;
}

interface UseSubscriptionResult {
  isSubscribed: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
  subscribe: (settings?: Partial<SubscriptionSettings>) => Promise<void>;
  unsubscribe: () => Promise<void>;
  toggle: () => Promise<void>;
  updateSettings: (settings: Partial<SubscriptionSettings>) => Promise<void>;
}

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getByType: (type: SubscriptionType) => Subscription[];
  totalUnread: number;
}

/**
 * Hook for managing a single subscription
 */
export function useSubscription(
  type: SubscriptionType,
  targetId: string,
  initialSubscription?: Subscription | null
): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(
    initialSubscription || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = useCallback(
    async (settings?: Partial<SubscriptionSettings>) => {
      setIsLoading(true);
      try {
        const body = {
          type,
          targetId,
          notificationMode: settings?.notificationMode || 'instant',
          emailNotifications: settings?.emailNotifications ?? true,
          pushNotifications: settings?.pushNotifications ?? true,
          includeReplies: settings?.includeReplies ?? true,
        };

        const { data } = await api.post('/api/forum/subscriptions', body);
        setSubscription(data.subscription);
      } catch (error) {
        setIsLoading(false);
        throw new Error(
          `Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [type, targetId]
  );

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      await api.delete(`/api/forum/subscriptions/${subscription.id}`);

      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  const toggle = useCallback(async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }, [subscription, subscribe, unsubscribe]);

  const updateSettings = useCallback(
    async (settings: Partial<SubscriptionSettings>) => {
      if (!subscription) return;

      setIsLoading(true);
      try {
        await api.patch(`/api/forum/subscriptions/${subscription.id}`, settings);

        setSubscription((prev) => (prev ? { ...prev, ...settings } : null));
      } finally {
        setIsLoading(false);
      }
    },
    [subscription]
  );

  return {
    isSubscribed: subscription !== null,
    isLoading,
    subscription,
    subscribe,
    unsubscribe,
    toggle,
    updateSettings,
  };
}

/**
 * Hook for managing all user subscriptions
 */
export function useSubscriptions(): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/forum/subscriptions');
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      logger.error('Failed to fetch subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getByType = useCallback(
    (type: SubscriptionType) => subscriptions.filter((sub) => sub.type === type),
    [subscriptions]
  );

  const totalUnread = subscriptions.reduce((acc, sub) => acc + sub.unreadCount, 0);

  return {
    subscriptions,
    isLoading,
    refresh,
    getByType,
    totalUnread,
  };
}

export default useSubscription;
