/**
 * Gamification WebSocket Hooks
 *
 * Provides React hooks for real-time gamification updates:
 * - XP/Level gains
 * - Achievement unlocks
 * - Cosmetic unlocks
 * - Prestige updates
 * - Event progress
 * - Marketplace notifications
 *
 * The socket store and types are split into submodules:
 * - ./gamification-socket.types   — Type definitions
 * - ./gamificationSocketStore     — Zustand store
 */

import { useEffect, useCallback, useRef } from 'react';

// Re-export types for consumers that import from this file
export type {
  XPGainEvent,
  AchievementUnlockEvent,
  CosmeticUnlockEvent,
  PrestigeUpdateEvent,
  EventProgressEvent,
  MarketplaceNotificationEvent,
  GamificationState,
  GamificationSocketStore,
} from './gamification-socket.types';

import type {
  XPGainEvent,
  AchievementUnlockEvent,
  CosmeticUnlockEvent,
  PrestigeUpdateEvent,
  EventProgressEvent,
  MarketplaceNotificationEvent,
} from './gamification-socket.types';

// Re-export the store
export { useGamificationSocketStore } from './gamificationSocketStore';
import { useGamificationSocketStore } from './gamificationSocketStore';

// ==================== HOOKS ====================

export function useGamificationSocket(token: string | null, userId: string | null) {
  const { connect, disconnect, state } = useGamificationSocketStore();

  useEffect(() => {
    if (token && userId) {
      connect(token, userId);
    }

    return () => {
      disconnect();
    };
  }, [token, userId, connect, disconnect]);

  return state;
}

export function useGamificationEvent<T = unknown>(event: string, callback: (data: T) => void) {
  const subscribe = useGamificationSocketStore((state) => state.subscribe);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = subscribe(event, (data) => {
      callbackRef.current(data as T);
    });

    return unsubscribe;
  }, [event, subscribe]);
}

export function useXPUpdates(callback: (data: XPGainEvent) => void) {
  useGamificationEvent('xp_gained', callback);
}

export function useLevelUp(
  callback: (data: { oldLevel: number; newLevel: number; rewards: unknown[] }) => void
) {
  useGamificationEvent('level_up', callback);
}

export function useAchievementUnlock(callback: (data: AchievementUnlockEvent) => void) {
  useGamificationEvent('achievement_unlocked', callback);
}

export function useCosmeticUnlock(callback: (data: CosmeticUnlockEvent) => void) {
  useGamificationEvent('cosmetic_unlocked', callback);
}

export function usePrestigeUpdate(callback: (data: PrestigeUpdateEvent) => void) {
  useGamificationEvent('prestige_updated', callback);
}

export function useEventProgress(callback: (data: EventProgressEvent) => void) {
  useGamificationEvent('event_progress', callback);
}

export function useEventMilestone(
  callback: (data: { eventId: string; milestone: number; reward: unknown }) => void
) {
  useGamificationEvent('event_milestone', callback);
}

export function useEventAnnouncements(callbacks: {
  onStart?: (data: { eventId: string; name: string }) => void;
  onEndingSoon?: (data: { eventId: string; hoursRemaining: number }) => void;
  onEnd?: (data: { eventId: string; name: string }) => void;
}) {
  useGamificationEvent('event_started', callbacks.onStart || (() => {}));
  useGamificationEvent('event_ending_soon', callbacks.onEndingSoon || (() => {}));
  useGamificationEvent('event_ended', callbacks.onEnd || (() => {}));
}

export function useMarketplaceNotifications(
  callback: (data: MarketplaceNotificationEvent) => void
) {
  useGamificationEvent('listing_sold', (data) =>
    callback({ type: 'listing_sold', data: data as Record<string, unknown> })
  );
  useGamificationEvent('item_purchased', (data) =>
    callback({ type: 'purchase_complete', data: data as Record<string, unknown> })
  );
  useGamificationEvent('price_alert', (data) =>
    callback({ type: 'price_drop', data: data as Record<string, unknown> })
  );
}

// ==================== NOTIFICATION TOAST HOOK ====================

export function useGamificationToasts() {
  const showToast = useCallback(
    (type: 'xp' | 'level' | 'achievement' | 'cosmetic' | 'prestige' | 'event', data: unknown) => {
      window.dispatchEvent(
        new CustomEvent('gamification:toast', {
          detail: { type, data },
        })
      );
    },
    []
  );

  useXPUpdates((data) => {
    if (data.amount >= 100) {
      showToast('xp', data);
    }
    if (data.levelUp) {
      showToast('level', data.levelUp);
    }
  });

  useAchievementUnlock((data) => {
    showToast('achievement', data);
  });

  useCosmeticUnlock((data) => {
    showToast('cosmetic', data);
  });

  usePrestigeUpdate((data) => {
    showToast('prestige', data);
  });

  useEventMilestone((data) => {
    showToast('event', data);
  });
}

export default useGamificationSocket;
