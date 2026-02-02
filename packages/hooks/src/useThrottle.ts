import { useEffect, useRef, useCallback } from 'react';

/**
 * Throttles a callback by the specified delay.
 *
 * @param callback - Function to throttle
 * @param delay - Minimum time between calls in milliseconds
 * @returns Throttled callback
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottle(() => {
 *   console.log('Scrolled!');
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef<number>(0);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        lastArgs.current = args;

        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(
            () => {
              if (lastArgs.current) {
                callback(...lastArgs.current);
                lastRan.current = Date.now();
                lastArgs.current = null;
              }
              timeoutRef.current = null;
            },
            delay - (now - lastRan.current)
          );
        }
      }
    },
    [callback, delay]
  ) as T;
}
