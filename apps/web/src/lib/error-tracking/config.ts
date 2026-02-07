/**
 * Error Tracking Configuration
 *
 * @module lib/error-tracking/config
 */

/** Service configuration */
export const CONFIG = {
  /** Maximum breadcrumbs to keep in memory */
  maxBreadcrumbs: 50,
  /** Rate limit: max errors per minute */
  maxErrorsPerMinute: 10,
  /** Queue retry interval (ms) */
  retryInterval: 60000,
  /** Max retry attempts per error */
  maxRetries: 3,
  /** Error endpoint (if using custom backend) */
  errorEndpoint: '/api/v1/telemetry/errors',
  /** Enable/disable error tracking */
  enabled: import.meta.env.PROD,
  /** Debug mode (logs to console instead of sending) */
  debug: import.meta.env.DEV,
  /** Sentry DSN (if using Sentry) */
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
} as const;
