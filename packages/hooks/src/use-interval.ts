/**
 * useInterval — a declarative setInterval hook that cleans up automatically.
 *
 * @module @cgraph/hooks/use-interval
 */

import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `delayMs` milliseconds.
 * Pass `null` for `delayMs` to pause the interval.
 *
 * @example
 * useInterval(() => setCount(c => c + 1), isRunning ? 1000 : null);
 */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
