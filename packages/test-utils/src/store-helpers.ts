/**
 * Store testing helpers.
 *
 * Utilities for creating isolated Zustand store instances
 * in tests without polluting global state.
 *
 * @module @cgraph/test-utils/store-helpers
 */

/**
 * Creates a fresh Zustand store instance for testing.
 *
 * Wraps a store creator so each test gets its own isolated state.
 *
 * @example
 * ```ts
 * const useStore = createMockStore(() =>
 *   create((set) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) })),
 * );
 *
 * // Each call returns fresh state
 * expect(useStore.getState().count).toBe(0);
 * ```
 */
export function createMockStore<T>(creator: () => T): T {
  return creator();
}
