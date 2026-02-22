/**
 * @cgraph/state — Shared Zustand store utilities for CGraph.
 *
 * Provides store creation helpers, middleware, and patterns used by
 * both web and mobile Zustand stores.
 * @module @cgraph/state
 */

export { createBoundedStore } from './create-bounded-store';
export { withReset } from './with-reset';
export { withDevtools } from './with-devtools';
export type { StoreWithReset, BoundedStoreConfig } from './types';
