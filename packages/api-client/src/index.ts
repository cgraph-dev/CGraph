/**
 * @cgraph/api-client — Resilient API client for CGraph
 *
 * Production-grade resilience layer with:
 * - Retry with exponential backoff + jitter
 * - Circuit breaker (closed → open → half-open)
 * - Request timeout via AbortController
 * - Composable `withResilience()` wrapper for any fetch-compatible function
 *
 * @module @cgraph/api-client
 * @version 0.9.31
 */

// ---------------------------------------------------------------------------
// Resilience primitives
// ---------------------------------------------------------------------------
export {
  CircuitBreaker,
  CircuitOpenError,
  RequestTimeoutError,
  withResilience,
  withRetry,
  withTimeout,
} from './resilience';

export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitBreakerStats,
  RetryConfig,
  ResilienceConfig,
} from './resilience';

// ---------------------------------------------------------------------------
// API client factory
// ---------------------------------------------------------------------------
export { createApiClient } from './client';

export type { ApiClientConfig, ApiClient, ApiRequestOptions } from './client';
