/**
 * Exponential Backoff with Equal Jitter
 *
 * Prevents thundering herd reconnect storms at scale (10M+ users).
 * Uses "equal jitter" strategy recommended by AWS:
 *   delay = exponential/2 + random(0, exponential/2)
 *
 * This guarantees a minimum delay of half the exponential value
 * while adding sufficient randomness to spread reconnects across time.
 *
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */

export interface BackoffOptions {
  /** Base delay in milliseconds (default: 1000) */
  baseMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxMs?: number;
}

/**
 * Returns a backoff function suitable for Phoenix Socket's `reconnectAfterMs`.
 *
 * @example
 * ```ts
 * import { exponentialBackoffWithJitter } from '@cgraph/socket';
 *
 * const socket = new Socket(url, {
 *   reconnectAfterMs: exponentialBackoffWithJitter(),
 * });
 * ```
 */
export function exponentialBackoffWithJitter(
  options: BackoffOptions = {}
): (tries: number) => number {
  const { baseMs = 1000, maxMs = 30000 } = options;

  return (tries: number): number => {
    const exponential = Math.min(baseMs * Math.pow(2, tries - 1), maxMs);
    // Equal jitter: half deterministic + half random
    return Math.floor(exponential / 2 + Math.random() * (exponential / 2));
  };
}
