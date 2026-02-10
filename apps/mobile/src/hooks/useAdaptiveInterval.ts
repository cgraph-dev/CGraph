/**
 * useAdaptiveInterval — an interval hook that slows down when the app is
 * backgrounded and speeds back up when it becomes active again.
 *
 * React Native equivalent of the web useAdaptiveInterval.
 * Uses AppState API instead of document.visibilitychange.
 *
 * Usage:
 *   useAdaptiveInterval(fetchOnlineUsers, 30_000);
 *   // → 30s when active, 120s when backgrounded
 *
 *   useAdaptiveInterval(replenishPrekeys, 300_000, { backgroundMultiplier: 6 });
 *   // → 5 min when active, 30 min when backgrounded
 *
 * @module hooks/useAdaptiveInterval
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export interface AdaptiveIntervalOptions {
  /** Multiplier applied to the interval when app is backgrounded (default: 4) */
  backgroundMultiplier?: number;
  /** Whether the interval is enabled (default: true) */
  enabled?: boolean;
  /** Run the callback immediately on mount (default: false) */
  immediate?: boolean;
}

/**
 * Sets up an interval that adapts to app state:
 *  - Uses `activeMs` when the app is in the foreground.
 *  - Uses `activeMs × backgroundMultiplier` when the app is backgrounded.
 *
 * The timer resets on app state change so the new cadence kicks in
 * immediately without waiting for the previous cycle to expire.
 */
export function useAdaptiveInterval(
  callback: () => void | Promise<void>,
  activeMs: number,
  options: AdaptiveIntervalOptions = {},
) {
  const { backgroundMultiplier = 4, enabled = true, immediate = false } = options;

  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  const currentInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const getDelay = useCallback(
    () => (appStateRef.current === 'active' ? activeMs : activeMs * backgroundMultiplier),
    [activeMs, backgroundMultiplier],
  );

  const restart = useCallback(() => {
    if (currentInterval.current) clearInterval(currentInterval.current);
    if (!enabled) return;
    const delay = getDelay();
    currentInterval.current = setInterval(() => {
      void savedCallback.current();
    }, delay);
  }, [enabled, getDelay]);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      void savedCallback.current();
    }

    restart();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      restart();
    });

    return () => {
      if (currentInterval.current) clearInterval(currentInterval.current);
      subscription.remove();
    };
  }, [enabled, restart, immediate]);
}
