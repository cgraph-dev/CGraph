/**
 * Types for shared store utilities.
 * @module @cgraph/state/types
 */

/** A Zustand store that exposes a reset() action to return to initial state */
export interface StoreWithReset {
  reset: () => void;
}

/** Configuration for a bounded array in a store */
export interface BoundedStoreConfig<T> {
  /** Maximum number of items in the array */
  max: number;
  /** The array items */
  items: T[];
}
