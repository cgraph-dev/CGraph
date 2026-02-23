/**
 * Hook for debouncing values with configurable delay.
 * @module hooks/useDebounce
 */
import { useState, useEffect, useRef } from 'react';

/**
 * Hook that debounces a value.
 *
 * Returns the debounced value that only updates after the specified
 * delay has passed without the value changing.
 *
 * @param value - value to debounce
 * @param delay - debounce delay in milliseconds
 * @returns debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // API call only happens 300ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function.
 *
 * @param callback - function to debounce
 * @param delay - debounce delay in milliseconds
 * @returns debounced function
 *
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   api.save(data);
 * }, 500);
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };
}

/**
 * Hook that returns a throttled callback function.
 *
 * Unlike debounce, throttle ensures the function is called at most once
 * within the specified interval, making it ideal for high-frequency events
 * like scroll, resize, or mousemove handlers.
 *
 * @param callback - function to throttle
 * @param limit - minimum time between calls in milliseconds
 * @returns throttled function
 *
 * @example
 * const throttledMouseMove = useThrottledCallback((e) => {
 *   updatePosition(e.clientX, e.clientY);
 * }, 16); // ~60fps
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit) {
      lastRunRef.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule a trailing call to ensure final state is captured
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        callbackRef.current(...args);
      }, limit - timeSinceLastRun);
    }
  };
}
