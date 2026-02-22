/**
 * Zustand store factory with bounded array support.
 *
 * Wraps Zustand's create() to enforce MAX limits on array slices,
 * preventing unbounded growth in chat/message/group stores.
 *
 * @module @cgraph/state/create-bounded-store
 */

import { create, type StateCreator, type StoreApi } from 'zustand';

interface BoundedArrayOptions {
  /** Field name in the store state */
  readonly field: string;
  /** Maximum number of items allowed */
  readonly max: number;
}

interface BoundedStoreOptions<T> {
  /** Array fields that should be bounded */
  readonly boundedArrays?: readonly BoundedArrayOptions[];
  /** The Zustand state creator */
  readonly creator: StateCreator<T>;
}

/**
 * Creates a Zustand store with automatic array bounding.
 *
 * Any array field listed in `boundedArrays` will be automatically
 * trimmed to its max length on every set() call.
 *
 * @example
 * ```ts
 * const useStore = createBoundedStore({
 *   boundedArrays: [{ field: 'messages', max: 500 }],
 *   creator: (set) => ({
 *     messages: [],
 *     addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
 *   }),
 * });
 * ```
 */
export function createBoundedStore<T extends object>(options: BoundedStoreOptions<T>): StoreApi<T> {
  const { boundedArrays = [], creator } = options;

  const store = create<T>(creator);

  if (boundedArrays.length > 0) {
    store.subscribe((state) => {
      const patches: Partial<T> = {};
      let needsPatch = false;

      for (const { field, max } of boundedArrays) {
        const arr = (state as Record<string, unknown>)[field];
        if (Array.isArray(arr) && arr.length > max) {
          (patches as Record<string, unknown>)[field] = arr.slice(-max);
          needsPatch = true;
        }
      }

      if (needsPatch) {
        store.setState(patches);
      }
    });
  }

  return store;
}
