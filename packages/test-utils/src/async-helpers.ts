/**
 * Async testing helpers.
 *
 * Utilities for waiting on microtasks and promises in tests.
 *
 * @module @cgraph/test-utils/async-helpers
 */

/**
 * Waits for the next microtask tick.
 *
 * Useful for waiting on state updates after dispatching actions.
 *
 * @example
 * ```ts
 * store.getState().fetchData();
 * await waitForNextTick();
 * expect(store.getState().data).toBeDefined();
 * ```
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Flushes all pending promises in the microtask queue.
 *
 * @example
 * ```ts
 * triggerAsyncAction();
 * await flushPromises();
 * expect(result).toBe(expected);
 * ```
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
