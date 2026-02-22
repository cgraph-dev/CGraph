/**
 * API configuration constants.
 * @module @cgraph/config/api
 */

export const API_CONFIG = {
  /** API version prefix */
  version: 'v1',
  /** Default pagination page size */
  defaultPageSize: 25,
  /** Maximum pagination page size */
  maxPageSize: 100,
  /** Request timeout in milliseconds */
  requestTimeout: 30_000,
  /** WebSocket heartbeat interval */
  heartbeatInterval: 30_000,
  /** Max retry attempts for failed requests */
  maxRetries: 3,
  /** Base retry delay in ms (exponential backoff) */
  retryBaseDelay: 1_000,
} as const;
