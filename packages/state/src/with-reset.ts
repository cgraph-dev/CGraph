/**
 * Reset middleware for Zustand stores.
 *
 * Captures initial state at store creation and exposes a reset()
 * action that restores it. Satisfies Rule 3.4 (every store must
 * have reset()).
 *
 * @module @cgraph/state/with-reset
 */

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type WithReset = <
  T extends object,
  Mps extends Array<[StoreMutatorIdentifier, unknown]> = [],
  Mcs extends Array<[StoreMutatorIdentifier, unknown]> = [],
>(
  creator: StateCreator<T, Mps, Mcs>
) => StateCreator<T & { reset: () => void }, Mps, Mcs>;

/**
 * Adds a `reset()` action to any Zustand store.
 *
 * @example
 * ```ts
 * const useStore = create(
 *   withReset((set) => ({
 *     count: 0,
 *     increment: () => set((s) => ({ count: s.count + 1 })),
 *   })),
 * );
 *
 * useStore.getState().reset(); // count → 0
 * ```
 */
export const withReset: WithReset = (creator) => (set, get, api) => {
  const state = creator(set, get, api);
  const initialState = { ...state };

  return {
    ...state,
    reset: () => {
      const patch: Record<string, unknown> = {};

      for (const key of Object.keys(initialState)) {
        if (typeof (initialState as Record<string, unknown>)[key] !== 'function') {
          patch[key] = (initialState as Record<string, unknown>)[key];
        }
      }

      set(patch as Parameters<typeof set>[0]);
    },
  };
};
