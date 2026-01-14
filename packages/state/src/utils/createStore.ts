/**
 * Store Creation Utilities
 */

import { create, StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Draft } from 'immer';

/**
 * Create a store with common middleware (immer, subscribeWithSelector)
 */
export function createStore<T extends object>(
  initializer: StateCreator<T, [['zustand/immer', never]], []>
) {
  return create<T>()(
    subscribeWithSelector(
      immer(initializer)
    )
  );
}

/**
 * Create a store slice for composing multiple stores
 */
export function createSlice<T extends object>(
  sliceCreator: (
    set: (fn: (state: Draft<T>) => void) => void,
    get: () => T
  ) => T
): StateCreator<T, [['zustand/immer', never]], []> {
  return sliceCreator as StateCreator<T, [['zustand/immer', never]], []>;
}

/**
 * Combine multiple slices into a single store
 */
export function combineSlices<T extends object>(
  ...slices: StateCreator<Partial<T>, [['zustand/immer', never]], []>[]
): StateCreator<T, [['zustand/immer', never]], []> {
  return (set, get, api) => {
    const combined = {} as T;
    for (const slice of slices) {
      Object.assign(combined, slice(set as never, get as never, api as never));
    }
    return combined;
  };
}
