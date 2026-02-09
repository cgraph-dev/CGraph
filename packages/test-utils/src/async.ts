/**
 * Framework-agnostic async test helpers.
 *
 * Works identically in Vitest (web) and Jest (mobile).
 */

/** Sleep for `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Flush all pending micro-tasks (resolved promises). */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    // Use setImmediate in Node ≥ 18, setTimeout(0) as fallback
    if (typeof setImmediate === 'function') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Poll a predicate until it returns `true` or timeout is reached.
 * Useful for waiting on async store updates or DOM changes.
 */
export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  { timeout = 2000, interval = 50 } = {},
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await predicate()) return;
    await delay(interval);
  }
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Creates a deterministic ID generator for tests.
 *
 * Usage:
 *   const id = createIdGenerator('msg');
 *   id(); // 'msg-1'
 *   id(); // 'msg-2'
 */
export function createIdGenerator(prefix = 'id'): () => string {
  let seq = 0;
  return () => `${prefix}-${++seq}`;
}
