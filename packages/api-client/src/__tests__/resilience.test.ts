import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitOpenError,
  RequestTimeoutError,
  withRetry,
  withTimeout,
  withResilience,
} from '../resilience';

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, resetTimeout: 1000 });
  });

  it('starts in closed state', () => {
    expect(cb.getStats().state).toBe('closed');
    expect(cb.isAllowed()).toBe(true);
  });

  it('opens after reaching failure threshold', () => {
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('closed');
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    expect(cb.isAllowed()).toBe(false);
  });

  it('transitions to half-open after reset timeout', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');

    // Advance time past reset timeout
    vi.useFakeTimers();
    vi.advanceTimersByTime(1100);
    expect(cb.isAllowed()).toBe(true);
    expect(cb.getStats().state).toBe('half-open');
    vi.useRealTimers();
  });

  it('closes again after enough successes in half-open', () => {
    vi.useFakeTimers();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1100);
    cb.isAllowed(); // trigger half-open

    cb.recordSuccess();
    expect(cb.getStats().state).toBe('half-open');
    cb.recordSuccess();
    expect(cb.getStats().state).toBe('closed');
    vi.useRealTimers();
  });

  it('re-opens on failure in half-open', () => {
    vi.useFakeTimers();
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    vi.advanceTimersByTime(1100);
    cb.isAllowed(); // trigger half-open

    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    vi.useRealTimers();
  });

  it('resets failure counter on success in closed state', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.getStats().failures).toBe(0);
    // Should not open — counter was reset
    cb.recordFailure();
    expect(cb.getStats().state).toBe('closed');
  });

  it('tracks cumulative stats', () => {
    cb.recordSuccess();
    cb.recordSuccess();
    cb.recordFailure();
    const stats = cb.getStats();
    expect(stats.totalRequests).toBe(3);
    expect(stats.totalSuccesses).toBe(2);
    expect(stats.totalFailures).toBe(1);
  });

  it('reset() forces closed state', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getStats().state).toBe('open');
    cb.reset();
    expect(cb.getStats().state).toBe('closed');
    expect(cb.isAllowed()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately on success', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok', { status: 200 }));

    const retryFetch = withRetry(mockFetch, { maxRetries: 3, baseDelay: 100, jitter: 0 });
    const response = await retryFetch('https://api.example.com/test');

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 503 and eventually succeeds', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(new Response('down', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const retryFetch = withRetry(mockFetch, { maxRetries: 3, baseDelay: 10, jitter: 0 });
    const response = await retryFetch('https://api.example.com/test');

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('returns last response after exhausting retries', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('down', { status: 500 }));

    const retryFetch = withRetry(mockFetch, { maxRetries: 2, baseDelay: 10, jitter: 0 });
    const response = await retryFetch('https://api.example.com/test');

    expect(response.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('does not retry on 4xx errors', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('not found', { status: 404 }));

    const retryFetch = withRetry(mockFetch, { maxRetries: 3, baseDelay: 10, jitter: 0 });
    const response = await retryFetch('https://api.example.com/test');

    expect(response.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors (TypeError)', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const retryFetch = withRetry(mockFetch, { maxRetries: 3, baseDelay: 10, jitter: 0 });
    const response = await retryFetch('https://api.example.com/test');

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry aborted requests', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValueOnce(abortError);

    const retryFetch = withRetry(mockFetch, { maxRetries: 3, baseDelay: 10, jitter: 0 });
    await expect(retryFetch('https://api.example.com/test')).rejects.toThrow('Aborted');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns response before timeout', async () => {
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(new Response('ok', { status: 200 })), 50)
          )
      );

    const timeoutFetch = withTimeout(mockFetch, 5000);
    const promise = timeoutFetch('https://api.example.com/test');
    vi.advanceTimersByTime(50);
    const response = await promise;

    expect(response.status).toBe(200);
  });

  it('throws RequestTimeoutError on timeout', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          // Simulate abort behavior
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal!.reason);
          });
        })
    );

    const timeoutFetch = withTimeout(mockFetch, 100);
    const promise = timeoutFetch('https://api.example.com/test');
    vi.advanceTimersByTime(150);

    await expect(promise).rejects.toThrow(RequestTimeoutError);
  });

  it('passes through with timeout <= 0', () => {
    const mockFetch = vi.fn<typeof fetch>();
    const result = withTimeout(mockFetch, 0);
    expect(result).toBe(mockFetch);
  });
});

// ---------------------------------------------------------------------------
// withResilience (integration)
// ---------------------------------------------------------------------------

describe('withResilience', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a fetch function and circuit breaker', () => {
    const mockFetch = vi.fn<typeof fetch>();
    const result = withResilience(mockFetch);

    expect(typeof result.fetch).toBe('function');
    expect(result.circuitBreaker).toBeInstanceOf(CircuitBreaker);
  });

  it('records success on 2xx response', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response('ok', { status: 200 }));

    const { fetch: resilientFetch, circuitBreaker } = withResilience(mockFetch, {
      timeout: 0,
      retry: { maxRetries: 0 },
    });

    await resilientFetch('https://api.example.com/test');

    expect(circuitBreaker.getStats().totalSuccesses).toBe(1);
    expect(circuitBreaker.getStats().totalFailures).toBe(0);
  });

  it('records failure on 5xx response', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('error', { status: 500 }));

    const { fetch: resilientFetch, circuitBreaker } = withResilience(mockFetch, {
      timeout: 0,
      retry: { maxRetries: 0 },
    });

    await resilientFetch('https://api.example.com/test');

    expect(circuitBreaker.getStats().totalFailures).toBe(1);
  });

  it('throws CircuitOpenError when circuit is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const mockFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('error', { status: 500 }));

    const { fetch: resilientFetch, circuitBreaker } = withResilience(mockFetch, {
      timeout: 0,
      retry: { maxRetries: 0 },
      circuitBreaker: { failureThreshold: 2, successThreshold: 1, resetTimeout: 60_000 },
    });

    // Trip the breaker
    await resilientFetch('https://api.example.com/test');
    await resilientFetch('https://api.example.com/test');

    expect(circuitBreaker.getStats().state).toBe('open');
    await expect(resilientFetch('https://api.example.com/test')).rejects.toThrow(CircuitOpenError);
  });

  it('records failure on network error', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const mockFetch = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network error'));

    const { fetch: resilientFetch, circuitBreaker } = withResilience(mockFetch, {
      timeout: 0,
      retry: { maxRetries: 0 },
    });

    await expect(resilientFetch('https://api.example.com/test')).rejects.toThrow();
    expect(circuitBreaker.getStats().totalFailures).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

describe('Error classes', () => {
  it('CircuitOpenError has correct name and stats', () => {
    const stats: import('../resilience').CircuitBreakerStats = {
      state: 'open',
      failures: 5,
      successes: 0,
      lastFailureTime: Date.now(),
      totalRequests: 10,
      totalFailures: 5,
      totalSuccesses: 5,
    };
    const error = new CircuitOpenError(undefined, stats);
    expect(error.name).toBe('CircuitOpenError');
    expect(error.stats).toBe(stats);
    expect(error.message).toContain('Circuit breaker is open');
  });

  it('RequestTimeoutError has correct name and timeout', () => {
    const error = new RequestTimeoutError(5000, 'https://api.example.com/test');
    expect(error.name).toBe('RequestTimeoutError');
    expect(error.timeoutMs).toBe(5000);
    expect(error.url).toBe('https://api.example.com/test');
    expect(error.message).toContain('5000ms');
  });
});
