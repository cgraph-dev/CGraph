/**
 * useAdaptiveInterval — an interval hook that slows down when the tab is
 * hidden and speeds back up when it becomes visible again.
 *
 * Motivation:
 *   Browsers throttle timers in background tabs anyway (to ≥ 1 s),
 *   but we can go further by extending the interval to a configurable
 *   multiplier (default 4×) so polling calls don't pile up.
 *
 * Usage:
 *   useAdaptiveInterval(fetchActivities, 30_000);
 *   // → 30 s when active, 120 s when hidden
 *
 *   useAdaptiveInterval(fetchStats, 5_000, { hiddenMultiplier: 6 });
 *   // → 5 s when active, 30 s when hidden
 *
 * @module hooks/useAdaptiveInterval
 */

import { useEffect, useRef, useCallback } from 'react';

export interface AdaptiveIntervalOptions {
  /** Multiplier applied to the interval when the tab is hidden (default: 4) */
  hiddenMultiplier?: number;
  /** Whether the interval is enabled (default: true) */
  enabled?: boolean;
  /** Run the callback immediately on mount (default: false) */
  immediate?: boolean;
}

/**
 * Sets up an interval that adapts to document visibility:
 *  - Uses `activeMs` when the tab is visible.
 *  - Uses `activeMs × hiddenMultiplier` when the tab is hidden.
 *
 * The timer resets on visibility change so the new cadence kicks in
 * immediately without waiting for the previous cycle to expire.
 */
export function useAdaptiveInterval(
  callback: () => void | Promise<void>,
  activeMs: number,
  options: AdaptiveIntervalOptions = {},
) {
  const { hiddenMultiplier = 4, enabled = true, immediate = false } = options;

  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  const currentInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDelay = useCallback(
    () => (document.hidden ? activeMs * hiddenMultiplier : activeMs),
    [activeMs, hiddenMultiplier],
  );

  // Start / restart the interval with the appropriate delay.
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

    // Optionally fire immediately on mount
    if (immediate) {
      void savedCallback.current();
    }

    restart();

    const onVisibilityChange = () => {
      restart();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      if (currentInterval.current) clearInterval(currentInterval.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, restart, immediate]);
}
