/**
 * API Client Resilience Layer — retry, circuit breaker, and timeout.
 *
 * Wraps fetch calls with production-grade error handling:
 * - **Retry**: Exponential backoff for transient failures (5xx, network)
 * - **Circuit breaker**: Prevents cascading failures when backend is down
 * - **Timeout**: Enforces request deadlines
 * - **Jitter**: Randomized delay to prevent thundering herd
 *
 * @example
 *   const resilientFetch = withResilience(fetch, {
 *     retry: { maxRetries: 3 },
 *     circuitBreaker: { failureThreshold: 5 },
 *     timeout: 10_000,
 *   });
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Max retry attempts (default: 3). */
  readonly maxRetries?: number;
  /** Initial delay in ms (default: 500). */
  readonly initialDelay?: number;
  /** Maximum delay in ms (default: 10_000). */
  readonly maxDelay?: number;
  /** Backoff multiplier (default: 2). */
  readonly factor?: number;
  /** Add random jitter to delay (default: true). */
  readonly jitter?: boolean;
  /** HTTP status codes that are retryable (default: [429, 500, 502, 503, 504]). */
  readonly retryableStatuses?: readonly number[];
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5). */
  readonly failureThreshold?: number;
  /** Time in ms before attempting recovery (default: 30_000). */
  readonly resetTimeout?: number;
  /** Number of successful requests in half-open to close circuit (default: 2). */
  readonly successThreshold?: number;
}

export interface ResilienceConfig {
  /** Retry configuration (set to false to disable). */
  readonly retry?: RetryConfig | false;
  /** Circuit breaker configuration (set to false to disable). */
  readonly circuitBreaker?: CircuitBreakerConfig | false;
  /** Request timeout in ms (default: 15_000). Set to 0 to disable. */
  readonly timeout?: number;
  /** Called when a retry occurs (for logging/metrics). */
  readonly onRetry?: (attempt: number, error: Error, delay: number) => void;
  /** Called when circuit breaker state changes. */
  readonly onCircuitStateChange?: (state: CircuitState) => void;
}

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: Required<CircuitBreakerConfig>;
  private readonly onStateChange?: (state: CircuitState) => void;

  constructor(config?: CircuitBreakerConfig, onStateChange?: (state: CircuitState) => void) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      resetTimeout: config?.resetTimeout ?? 30_000,
      successThreshold: config?.successThreshold ?? 2,
    };
    this.onStateChange = onStateChange;
  }

  getState(): CircuitState {
    return this.state;
  }

  /** Check if request is allowed. */
  canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true;
      case 'open': {
        const elapsed = Date.now() - this.lastFailureTime;
        if (elapsed >= this.config.resetTimeout) {
          this.transition('half-open');
          return true;
        }
        return false;
      }
      case 'half-open':
        return true;
    }
  }

  /** Record a successful request. */
  recordSuccess(): void {
    switch (this.state) {
      case 'half-open':
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.transition('closed');
        }
        break;
      case 'closed':
        this.failureCount = 0;
        break;
    }
  }

  /** Record a failed request. */
  recordFailure(): void {
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case 'closed':
        this.failureCount++;
        if (this.failureCount >= this.config.failureThreshold) {
          this.transition('open');
        }
        break;
      case 'half-open':
        this.transition('open');
        break;
    }
  }

  /** Reset circuit breaker to closed state. */
  reset(): void {
    this.transition('closed');
  }

  private transition(newState: CircuitState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.failureCount = 0;
    this.successCount = 0;
    this.onStateChange?.(newState);
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open — request rejected');
    this.name = 'CircuitOpenError';
  }
}

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

// ---------------------------------------------------------------------------
// Resilient Fetch Wrapper
// ---------------------------------------------------------------------------

const DEFAULT_RETRYABLE_STATUSES = [429, 500, 502, 503, 504] as const;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function addJitter(delay: number): number {
  // ±25% jitter
  return delay * (0.75 + Math.random() * 0.5);
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // Network error
  if (error instanceof DOMException && error.name === 'AbortError') return false;
  return false;
}

/**
 * Wraps a fetch function with retry, circuit breaker, and timeout.
 *
 * @returns A fetch-compatible function with resilience built in.
 */
export function withResilience(
  fetchFn: typeof fetch,
  config?: ResilienceConfig,
): typeof fetch {
  const retryConfig: Required<RetryConfig> | null = config?.retry === false
    ? null
    : {
        maxRetries: config?.retry?.maxRetries ?? 3,
        initialDelay: config?.retry?.initialDelay ?? 500,
        maxDelay: config?.retry?.maxDelay ?? 10_000,
        factor: config?.retry?.factor ?? 2,
        jitter: config?.retry?.jitter ?? true,
        retryableStatuses: config?.retry?.retryableStatuses ?? [...DEFAULT_RETRYABLE_STATUSES],
      };

  const breaker = config?.circuitBreaker === false
    ? null
    : new CircuitBreaker(
        config?.circuitBreaker ?? undefined,
        config?.onCircuitStateChange,
      );

  const timeoutMs = config?.timeout ?? 15_000;

  return async function resilientFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Circuit breaker check
    if (breaker && !breaker.canExecute()) {
      throw new CircuitOpenError();
    }

    const maxAttempts = retryConfig ? retryConfig.maxRetries + 1 : 1;
    let lastError: Error | undefined;
    let delay = retryConfig?.initialDelay ?? 500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Timeout wrapper
        let response: Response;
        if (timeoutMs > 0 && !init?.signal) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            response = await fetchFn(input, { ...init, signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        } else {
          response = await fetchFn(input, init);
        }

        // Check for retryable HTTP status
        if (
          retryConfig &&
          attempt < retryConfig.maxRetries &&
          (retryConfig.retryableStatuses as readonly number[]).includes(response.status)
        ) {
          lastError = new Error(`HTTP ${response.status}`);
          const retryDelay = retryConfig.jitter ? addJitter(delay) : delay;
          config?.onRetry?.(attempt + 1, lastError, retryDelay);
          await sleep(retryDelay);
          delay = Math.min(delay * retryConfig.factor, retryConfig.maxDelay);
          continue;
        }

        // Success — record and return
        breaker?.recordSuccess();
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Timeout converts AbortError
        if (err instanceof DOMException && err.name === 'AbortError' && timeoutMs > 0 && !init?.signal) {
          lastError = new RequestTimeoutError(timeoutMs);
        } else {
          lastError = err;
        }

        // Non-retryable errors
        if (!isRetryableError(error) && !(lastError instanceof RequestTimeoutError)) {
          breaker?.recordFailure();
          throw lastError;
        }

        // Retry if attempts remain
        if (retryConfig && attempt < retryConfig.maxRetries) {
          const retryDelay = retryConfig.jitter ? addJitter(delay) : delay;
          config?.onRetry?.(attempt + 1, lastError, retryDelay);
          await sleep(retryDelay);
          delay = Math.min(delay * retryConfig.factor, retryConfig.maxDelay);
          continue;
        }
      }
    }

    // All retries exhausted
    breaker?.recordFailure();
    throw lastError ?? new Error('Request failed');
  };
}
