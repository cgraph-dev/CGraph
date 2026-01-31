/**
 * Zustand Store Middleware Utilities
 *
 * Provides shared middleware configurations for Zustand stores including:
 * - DevTools integration for debugging
 * - Performance monitoring
 * - Action logging
 *
 * @module storeMiddleware
 */

import { devtools, type DevtoolsOptions } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('StoreMiddleware');

// Check if we're in development mode
const isDev = import.meta.env.DEV;

/**
 * DevTools configuration options
 */
export interface StoreDevtoolsOptions extends DevtoolsOptions {
  /** Store name for DevTools display */
  name: string;
  /** Enable time-travel debugging */
  trace?: boolean;
  /** Max number of actions to keep in history */
  maxAge?: number;
}

/**
 * Default DevTools options
 */
const defaultDevtoolsOptions: Partial<StoreDevtoolsOptions> = {
  enabled: isDev,
  trace: isDev,
  maxAge: 50,
  anonymousActionType: 'anonymous',
};

/**
 * Create a store with DevTools support
 *
 * This is a type-safe wrapper that adds Redux DevTools integration
 * to any Zustand store for debugging.
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { withDevtools } from '@/stores/middleware';
 *
 * interface CounterState {
 *   count: number;
 *   increment: () => void;
 * }
 *
 * export const useCounterStore = create<CounterState>()(
 *   withDevtools(
 *     (set) => ({
 *       count: 0,
 *       increment: () => set((state) => ({ count: state.count + 1 })),
 *     }),
 *     { name: 'counter' }
 *   )
 * );
 * ```
 */
export function withDevtools<T>(
  initializer: StateCreator<T, [], []>,
  options: StoreDevtoolsOptions
): StateCreator<T, [], [['zustand/devtools', never]]> {
  const mergedOptions = { ...defaultDevtoolsOptions, ...options };
  return devtools(initializer, mergedOptions);
}

/**
 * Action logger middleware for debugging
 *
 * Logs all state changes to console in development mode
 *
 * @example
 * ```ts
 * const useStore = create<State>()(
 *   withLogger(
 *     (set) => ({ ... }),
 *     'myStore'
 *   )
 * );
 * ```
 */
export function withLogger<T extends object>(
  initializer: StateCreator<T, [], []>,
  storeName: string
): StateCreator<T, [], []> {
  return (set, get, store) => {
    type SetType = typeof set;
    const loggedSet: SetType = (partial, replace) => {
      const prevState = get();

      // Apply the state change - Zustand's set only accepts false | undefined for replace
      if (replace === true) {
        set(partial as T, true);
      } else {
        set(partial, false);
      }

      const nextState = get();

      if (isDev) {
        console.groupCollapsed(
          `%c[${storeName}] State Update`,
          'color: #10b981; font-weight: bold;'
        );
        console.debug('%cPrevious:', 'color: #ef4444', prevState);
        console.debug('%cNext:', 'color: #22c55e', nextState);
        console.debug('%cDiff:', 'color: #3b82f6', getDiff(prevState, nextState));
        console.groupEnd();
      }
    };

    return initializer(loggedSet, get, store);
  };
}

/**
 * Get the difference between two state objects
 */
function getDiff<T extends object>(prev: T, next: T): Partial<T> {
  const diff: Partial<T> = {};

  for (const key in next) {
    if (prev[key] !== next[key]) {
      diff[key] = next[key];
    }
  }

  return diff;
}

/**
 * Performance monitoring middleware
 *
 * Tracks action execution time and warns on slow updates
 */
export function withPerformance<T extends object>(
  initializer: StateCreator<T, [], []>,
  storeName: string,
  warnThresholdMs = 16 // One frame at 60fps
): StateCreator<T, [], []> {
  return (set, get, store) => {
    type SetType = typeof set;
    const timedSet: SetType = (partial, replace) => {
      const start = performance.now();
      if (replace === true) {
        set(partial as T, true);
      } else {
        set(partial, false);
      }
      const duration = performance.now() - start;

      if (isDev && duration > warnThresholdMs) {
        logger.warn(`[${storeName}] Slow state update: ${duration.toFixed(2)}ms`);
      }
    };

    return initializer(timedSet, get, store);
  };
}

/**
 * Reset store to initial state
 *
 * Returns a function that can be called to reset the store
 */
export function createResetFn<T extends object>(
  initialState: T,
  set: (state: T, replace: true) => void
): () => void {
  return () => {
    set(initialState, true);
  };
}

/**
 * Selector helpers for optimized component subscriptions
 *
 * Note: This requires a bound store hook (UseBoundStore), not a raw StoreApi.
 * Use with stores created via create<T>().
 */
export const createSelectors = <T extends object, S extends { getState: () => T }>(
  useStore: S & ((selector: (state: T) => unknown) => unknown)
): {
  use: { [K in keyof T]: () => T[K] };
} => {
  const selectors: Record<string, () => unknown> = {};

  for (const key of Object.keys(useStore.getState())) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Dynamic hook creation for selector pattern
    selectors[key] = () => useStore((state: T) => state[key as keyof T]);
  }

  return { use: selectors as { [K in keyof T]: () => T[K] } };
};

export default {
  withDevtools,
  withLogger,
  withPerformance,
  createResetFn,
  createSelectors,
};
