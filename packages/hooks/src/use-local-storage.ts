/**
 * useLocalStorage — persists state in localStorage with SSR safety.
 *
 * @module @cgraph/hooks/use-local-storage
 */

import { useState, useCallback } from 'react';

/**
 * Like `useState`, but the value is persisted to `localStorage` under `key`.
 * Falls back to `initialValue` when localStorage is unavailable (SSR, mobile).
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
        } catch {
          // Storage full or unavailable — state still updates in memory
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
