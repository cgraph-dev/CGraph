/**
 * createAsyncSlice — Standardized async state pattern for Zustand stores
 *
 * Provides a consistent `{ data, isLoading, error, fetch, retry, reset }`
 * pattern for any async operation in a Zustand store. Eliminates ad-hoc
 * try/catch + manual `isLoading` flag management.
 *
 * Usage:
 * ```ts
 * const useMyStore = create<MyState>()((set, get) => ({
 *   ...createAsyncSlice<MyData[]>('items', async () => {
 *     const res = await api.get('/items');
 *     return res.data;
 *   })(set, get),
 *
 *   // ... other store properties
 * }));
 * ```
 *
 * The consumer then gets:
 * ```ts
 * const { itemsData, itemsLoading, itemsError, fetchItems, retryItems, resetItems } = useMyStore();
 * ```
 *
 * @module lib/store/createAsyncSlice
 * @version 1.0.0
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('AsyncSlice');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  /** Timestamp of last successful fetch */
  lastFetchedAt: number | null;
}

export interface AsyncActions<T> {
  fetch: () => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

type SetState = (partial: Record<string, unknown>) => void;
type GetState = () => Record<string, unknown>;

/**
 * Creates a standardized async slice for Zustand stores.
 *
 * @param name - Unique identifier for this async operation (used as key prefix)
 * @param fetcher - Async function that returns the data
 * @param options - Optional configuration
 * @returns A function that takes (set, get) and returns the slice state + actions
 */
export function createAsyncSlice<T>(
  name: string,
  fetcher: () => Promise<T>,
  options: {
    /** Skip fetch if data was fetched within this many ms (default: 0 = always fetch) */
    staleTime?: number;
    /** Transform error before storing (e.g., extract message from API error) */
    transformError?: (err: unknown) => Error;
    /** Callback on successful fetch */
    onSuccess?: (data: T) => void;
    /** Callback on fetch error */
    onError?: (error: Error) => void;
  } = {},
) {
  const dataKey = `${name}Data`;
  const loadingKey = `${name}Loading`;
  const errorKey = `${name}Error`;
  const lastFetchedKey = `${name}LastFetchedAt`;
  const fetchKey = `fetch${capitalize(name)}`;
  const retryKey = `retry${capitalize(name)}`;
  const resetKey = `reset${capitalize(name)}`;

  return (set: SetState, get: GetState) => {
    const doFetch = async (): Promise<T | null> => {
      // Check stale time
      if (options.staleTime) {
        const lastFetched = get()[lastFetchedKey] as number | null;
        if (lastFetched && Date.now() - lastFetched < options.staleTime) {
          return get()[dataKey] as T;
        }
      }

      set({ [loadingKey]: true, [errorKey]: null });

      try {
        const data = await fetcher();
        set({
          [dataKey]: data,
          [loadingKey]: false,
          [errorKey]: null,
          [lastFetchedKey]: Date.now(),
        });
        options.onSuccess?.(data);
        return data;
      } catch (err: unknown) {
        const error = options.transformError
          ? options.transformError(err)
          : err instanceof Error
            ? err
            : new Error(String(err));

        logger.error(`AsyncSlice[${name}] fetch failed`, { error: error.message });
        set({
          [loadingKey]: false,
          [errorKey]: error,
        });
        options.onError?.(error);
        return null;
      }
    };

    return {
      // State
      [dataKey]: null as T | null,
      [loadingKey]: false,
      [errorKey]: null as Error | null,
      [lastFetchedKey]: null as number | null,

      // Actions
      [fetchKey]: doFetch,
      [retryKey]: doFetch, // Retry is the same as fetch but bypasses stale check
      [resetKey]: () => {
        set({
          [dataKey]: null,
          [loadingKey]: false,
          [errorKey]: null,
          [lastFetchedKey]: null,
        });
      },
    };
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── useAsync hook (for one-off async ops in components) ──────────────────────

import { useState, useCallback, useRef } from 'react';

interface UseAsyncReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing async operations in components.
 * For store-level async state, use `createAsyncSlice` instead.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(async () => {
 *   return await api.post('/messages', { text });
 * });
 * ```
 */
export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          setIsLoading(false);
        }
        return null;
      }
    },
    [asyncFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return { data, isLoading, error, execute, reset };
}
