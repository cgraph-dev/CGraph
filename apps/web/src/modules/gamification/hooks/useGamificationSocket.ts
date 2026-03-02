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
import { getNewlyUnlockedFeatures } from './useLevelGate';
import type { FeatureGateKey } from '@cgraph/shared-types';

// Re-export types for consumers that import from this file
export type {
  XPGainEvent,
  AchievementUnlockEvent,
  CosmeticUnlockEvent,
  PrestigeUpdateEvent,
  EventProgressEvent,
  MarketplaceNotificationEvent,
  XPAwardedEvent,
  CoinsAwardedEvent,
  CapReachedEvent,
  GamificationState,
  GamificationSocketStore,
} from './gamification-socket.types';

import type {
  XPGainEvent,
  XPAwardedEvent,
  CoinsAwardedEvent,
  CapReachedEvent,
  AchievementUnlockEvent,
  CosmeticUnlockEvent,
  PrestigeUpdateEvent,
  EventProgressEvent,
  MarketplaceNotificationEvent,
} from './gamification-socket.types';

// Re-export the store
export { useGamificationSocketStore } from './gamificationSocketStore';
import { isRecord } from '@/lib/api-utils';
import { useGamificationSocketStore } from './gamificationSocketStore';

// ==================== HOOKS ====================

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing gamification socket.
 *
 * @param token - Authentication token.
 * @param userId - The user id.
 */
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

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing gamification event.
 *
 * @param event - The event object.
 * @param callback - Callback function.
 */
export function useGamificationEvent<T = unknown>(event: string, callback: (data: T) => void) {
  const subscribe = useGamificationSocketStore((state) => state.subscribe);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = subscribe(event, (data) => {
       
      callbackRef.current(data as T); // safe downcast — generic event handler
    });

    return unsubscribe;
  }, [event, subscribe]);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing x p updates.
 *
 * @param callback - Callback function.
 */
export function useXPUpdates(callback: (data: XPGainEvent) => void) {
  useGamificationEvent('xp_gained', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing level up.
 *
 * @param callback - Callback function.
 */
export function useLevelUp(
  callback: (data: { oldLevel: number; newLevel: number; rewards: unknown[] }) => void
) {
  useGamificationEvent('level_up', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing achievement unlock.
 *
 * @param callback - Callback function.
 */
export function useAchievementUnlock(callback: (data: AchievementUnlockEvent) => void) {
  useGamificationEvent('achievement_unlocked', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing cosmetic unlock.
 *
 * @param callback - Callback function.
 */
export function useCosmeticUnlock(callback: (data: CosmeticUnlockEvent) => void) {
  useGamificationEvent('cosmetic_unlocked', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing prestige update.
 *
 * @param callback - Callback function.
 */
export function usePrestigeUpdate(callback: (data: PrestigeUpdateEvent) => void) {
  useGamificationEvent('prestige_updated', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing event progress.
 *
 * @param callback - Callback function.
 */
export function useEventProgress(callback: (data: EventProgressEvent) => void) {
  useGamificationEvent('event_progress', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing event milestone.
 *
 * @param callback - Callback function.
 */
export function useEventMilestone(
  callback: (data: { eventId: string; milestone: number; reward: unknown }) => void
) {
  useGamificationEvent('event_milestone', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing event announcements.
 *
 * @param callbacks - The callbacks.
 */
export function useEventAnnouncements(callbacks: {
  onStart?: (data: { eventId: string; name: string }) => void;
  onEndingSoon?: (data: { eventId: string; hoursRemaining: number }) => void;
  onEnd?: (data: { eventId: string; name: string }) => void;
}) {
  useGamificationEvent('event_started', callbacks.onStart || (() => {}));
  useGamificationEvent('event_ending_soon', callbacks.onEndingSoon || (() => {}));
  useGamificationEvent('event_ended', callbacks.onEnd || (() => {}));
}

// ==================== NEW XP PIPELINE HOOKS ====================

/**
 * Hook for XP awarded events from the XpEventHandler pipeline.
 * Richer payload than xp_gained — includes daily cap and level progress.
 */
export function useXPAwarded(callback: (data: XPAwardedEvent) => void) {
  useGamificationEvent('xp_awarded', callback);
}

/**
 * Hook for coin award events.
 */
export function useCoinsAwarded(callback: (data: CoinsAwardedEvent) => void) {
  useGamificationEvent('coins_awarded', callback);
}

/**
 * Hook for daily cap reached events.
 */
export function useCapReached(callback: (data: CapReachedEvent) => void) {
  useGamificationEvent('cap_reached', callback);
}

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing marketplace notifications.
 *
 * @param callback - Callback function.
 */
export function useMarketplaceNotifications(
  callback: (data: MarketplaceNotificationEvent) => void
) {
  useGamificationEvent('listing_sold', (data) =>
    callback({ type: 'listing_sold', data: isRecord(data) ? data : {} })
  );
  useGamificationEvent('item_purchased', (data) =>
    callback({ type: 'purchase_complete', data: isRecord(data) ? data : {} })
  );
  useGamificationEvent('price_alert', (data) =>
    callback({ type: 'price_drop', data: isRecord(data) ? data : {} })
  );
}

// ==================== NOTIFICATION TOAST HOOK ====================

/**
 * unknown for the gamification module.
 */
/**
 * Hook for managing gamification toasts.
 */
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

// ==================== FEATURE UNLOCK DETECTION ====================

/**
 * Hook that detects newly unlocked features on level-up events
 * and dispatches feature unlock toast events.
 *
 * Listens for `level_up` socket events, computes which features
 * were unlocked between oldLevel and newLevel, and fires a custom
 * DOM event for the FeatureUnlockToastManager to consume.
 */
export function useFeatureUnlockDetection() {
  useLevelUp(
    useCallback((data: { oldLevel: number; newLevel: number; rewards: unknown[] }) => {
      const unlocked = getNewlyUnlockedFeatures(data.oldLevel, data.newLevel);

      if (unlocked.length > 0) {
        window.dispatchEvent(
          new CustomEvent<{ features: FeatureGateKey[]; level: number }>(
            'gamification:features-unlocked',
            {
              detail: {
                features: unlocked,
                level: data.newLevel,
              },
            },
          ),
        );
      }
    }, []),
  );
}

export default useGamificationSocket;
