/**
 * Error Tracking Types
 *
 * Type definitions for the error tracking service.
 *
 * @module lib/error-tracking/types
 */

/** Contextual information attached to captured errors */
export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Stack trace (auto-captured for Error objects) */
  stack?: string;
  /** Error severity level */
  level?: 'fatal' | 'error' | 'warning' | 'info';
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** Extra context data */
  extra?: Record<string, unknown>;
}

/** User context for error enrichment */
export interface UserContext {
  /** User ID */
  id?: string;
  /** User email */
  email?: string;
  /** Display username */
  username?: string;
  /** Premium status flag */
  isPremium?: boolean;
}

/** A navigation/action breadcrumb for debugging trails */
export interface Breadcrumb {
  /** Timestamp of the event */
  timestamp: number;
  /** Category of breadcrumb */
  category: 'navigation' | 'http' | 'ui' | 'console' | 'error' | 'user' | 'websocket';
  /** Human-readable message */
  message: string;
  /** Breadcrumb level */
  level?: 'debug' | 'info' | 'warning' | 'error';
  /** Additional data */
  data?: Record<string, unknown>;
}

/** An error waiting in the offline retry queue */
export interface QueuedError {
  /** Unique error identifier */
  id: string;
  /** Error message (PII-stripped) */
  error: string;
  /** Error context */
  context: ErrorContext;
  /** User context at time of capture */
  userContext: UserContext | null;
  /** Breadcrumb trail at time of capture */
  breadcrumbs: Breadcrumb[];
  /** Capture timestamp */
  timestamp: number;
  /** Number of send retries */
  retryCount: number;
  /** Page URL at time of capture */
  url: string;
  /** Browser user agent */
  userAgent: string;
}

/** A performance transaction with named spans */
export interface Transaction {
  /** Transaction name */
  name: string;
  /** Start time (performance.now()) */
  startTime: number;
  /** Nested spans */
  spans: { name: string; startTime: number; endTime?: number }[];
}
