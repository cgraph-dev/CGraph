/**
 * Resilience primitives for network requests.
 *
 * Three composable layers:
 * 1. **Retry** — exponential backoff with jitter for transient failures
 * 2. **Circuit Breaker** — fail-fast when a downstream is unhealthy
 * 3. **Timeout** — hard deadline via AbortController
 *
 * Use `withResilience(fetch, config)` to apply all three at once.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Circuit breaker states following the standard 3-state model. */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit. Default: 5. */
  failureThreshold: number;
  /** Number of successes in half-open before closing. Default: 2. */
  successThreshold: number;
  /** How long to wait (ms) before trying half-open. Default: 30_000. */
  resetTimeout: number;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export interface RetryConfig {
  /** Max number of retry attempts (not counting the initial request). Default: 3. */
  maxRetries: number;
  /** Base delay in ms before first retry. Default: 1000. */
  baseDelay: number;
  /** Maximum delay cap in ms. Default: 30_000. */
  maxDelay: number;
  /**
   * HTTP status codes that should trigger a retry.
   * Default: [408, 429, 500, 502, 503, 504].
   */
  retryableStatuses: number[];
  /** Jitter factor (0–1). Applied as `delay * (1 + random * jitter)`. Default: 0.2. */
  jitter: number;
}

export interface ResilienceConfig {
  retry?: Partial<RetryConfig>;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  /** Request timeout in ms. 0 = no timeout. Default: 30_000. */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Thrown when the circuit breaker is open and rejecting requests. */
export class CircuitOpenError extends Error {
  override readonly name = 'CircuitOpenError';

  constructor(
    message = 'Circuit breaker is open — request rejected',
    public readonly stats: CircuitBreakerStats
  ) {
    super(message);
  }
}

/** Thrown when a request exceeds the configured timeout. */
export class RequestTimeoutError extends Error {
  override readonly name = 'RequestTimeoutError';

  constructor(
    public readonly timeoutMs: number,
    public readonly url?: string
  ) {
    super(`Request timed out after ${timeoutMs}ms${url ? ` (${url})` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Default configs
// ---------------------------------------------------------------------------

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  jitter: 0.2,
};

const DEFAULT_CB: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30_000,
};

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

/**
 * A 3-state circuit breaker (closed → open → half-open → closed).
 *
 * - **Closed**: requests flow normally. Failures increment a counter.
 * - **Open**: requests are rejected immediately with `CircuitOpenError`.
 * - **Half-open**: a limited number of requests are allowed through to probe
 *   recovery. On success, the circuit closes; on failure, it re-opens.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CB, ...config };
  }

  /** Current snapshot of the breaker's state and counters. */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /** Whether the circuit is currently allowing requests. */
  isAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      // Check if enough time has elapsed to move to half-open
      if (
        this.lastFailureTime !== null &&
        Date.now() - this.lastFailureTime >= this.config.resetTimeout
      ) {
        this.state = 'half-open';
        this.successes = 0;
        return true;
      }
      return false;
    }
    // half-open: allow through
    return true;
  }

  /** Record a successful request. */
  recordSuccess(): void {
    this.totalRequests++;
    this.totalSuccesses++;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
      }
    } else if (this.state === 'closed') {
      // Reset failure counter on success in closed state
      this.failures = 0;
    }
  }

  /** Record a failed request. */
  recordFailure(): void {
    this.totalRequests++;
    this.totalFailures++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Any failure in half-open immediately re-opens
      this.state = 'open';
      this.successes = 0;
    } else if (this.state === 'closed' && this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  /** Force the breaker into the closed state (e.g. for manual recovery). */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
  }
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff + jitter
// ---------------------------------------------------------------------------

/** Compute the delay for attempt `n` (0-indexed) with exponential backoff + jitter. */
function computeDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelay * 2 ** attempt;
  const capped = Math.min(exponential, config.maxDelay);
  return capped * (1 + Math.random() * config.jitter);
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // network error
  if (error instanceof DOMException && error.name === 'AbortError') return false;
  return false;
}

/**
 * Wrap a fetch-compatible function with retry logic.
 * Retries on network errors and configurable HTTP status codes.
 */
export function withRetry(fetchFn: typeof fetch, config: Partial<RetryConfig> = {}): typeof fetch {
  const cfg: RetryConfig = { ...DEFAULT_RETRY, ...config };

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
      try {
        const response = await fetchFn(input, init);

        // Don't retry if status is not retryable
        if (!cfg.retryableStatuses.includes(response.status)) {
          return response;
        }

        // If this was the last attempt, return whatever we got
        if (attempt === cfg.maxRetries) {
          return response;
        }

        // Respect Retry-After header if present (for 429s)
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000 || computeDelay(attempt, cfg), cfg.maxDelay)
          : computeDelay(attempt, cfg);

        await sleep(delay);
      } catch (error: unknown) {
        lastError = error;

        // Don't retry aborted requests
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        if (attempt === cfg.maxRetries || !isRetryableError(error)) {
          throw error;
        }

        await sleep(computeDelay(attempt, cfg));
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
  };
}

// ---------------------------------------------------------------------------
// Timeout
// ---------------------------------------------------------------------------

/**
 * Wrap a fetch-compatible function with a timeout.
 * Uses AbortController; merges with any existing signal in `init`.
 */
export function withTimeout(fetchFn: typeof fetch, timeoutMs: number): typeof fetch {
  if (timeoutMs <= 0) return fetchFn;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const existingSignal = init?.signal;

    // If the caller already provided a signal, listen for its abort
    if (existingSignal) {
      if (existingSignal.aborted) {
        controller.abort(existingSignal.reason);
      } else {
        existingSignal.addEventListener('abort', () => controller.abort(existingSignal.reason), {
          once: true,
        });
      }
    }

    const timer = setTimeout(() => {
      controller.abort(
        new RequestTimeoutError(
          timeoutMs,
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        )
      );
    }, timeoutMs);

    try {
      return await fetchFn(input, { ...init, signal: controller.signal });
    } catch (error: unknown) {
      if (error instanceof RequestTimeoutError) throw error;
      if (
        error instanceof DOMException &&
        error.name === 'AbortError' &&
        controller.signal.reason instanceof RequestTimeoutError
      ) {
        throw controller.signal.reason;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}

// ---------------------------------------------------------------------------
// Composed: withResilience
// ---------------------------------------------------------------------------

/**
 * Apply all three resilience layers to a fetch-compatible function.
 *
 * Order of execution (outermost → innermost):
 * 1. Circuit breaker check (fail-fast)
 * 2. Timeout wrapper
 * 3. Retry wrapper with backoff + jitter
 * 4. Actual fetch
 * 5. Circuit breaker record (success/failure)
 */
export function withResilience(
  fetchFn: typeof fetch,
  config: ResilienceConfig = {}
): { fetch: typeof fetch; circuitBreaker: CircuitBreaker } {
  const cb = new CircuitBreaker(config.circuitBreaker);
  const timeoutMs = config.timeout ?? 30_000;
  const retryConfig = config.retry ?? {};

  // Build the inner pipeline: timeout → retry → fetch
  let inner = fetchFn;
  inner = withRetry(inner, retryConfig);
  if (timeoutMs > 0) {
    inner = withTimeout(inner, timeoutMs);
  }

  const resilientFetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    // Circuit breaker pre-check
    if (!cb.isAllowed()) {
      throw new CircuitOpenError(undefined, cb.getStats());
    }

    try {
      const response = await inner(input, init);

      // 5xx = circuit breaker failure (client errors are not failures)
      if (response.status >= 500) {
        cb.recordFailure();
      } else {
        cb.recordSuccess();
      }

      return response;
    } catch (error: unknown) {
      cb.recordFailure();
      throw error;
    }
  };

  return { fetch: resilientFetch, circuitBreaker: cb };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
