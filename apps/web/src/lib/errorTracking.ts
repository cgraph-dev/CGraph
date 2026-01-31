/**
 * Web Error Tracking Service
 *
 * Production-ready error tracking infrastructure for the web app.
 * Provides a simple stub for error tracking that can be extended
 * to integrate with Sentry, LogRocket, or custom backend.
 *
 * @module lib/errorTracking
 * @version 1.0.0
 * @since v0.9.9
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Error severity level */
  level?: 'fatal' | 'error' | 'warning' | 'info';
  /** Tags for categorization */
  tags?: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'http' | 'ui' | 'console' | 'error' | 'user' | 'websocket';
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

const CONFIG = {
  maxBreadcrumbs: 30,
  enabled: !isDev,
  debug: isDev,
};

// ============================================================================
// State
// ============================================================================

const breadcrumbs: Breadcrumb[] = [];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Capture and report an error
 * @returns A unique error ID for tracking
 */
export function captureError(error: Error | string, context?: ErrorContext): string {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (CONFIG.debug) {
    console.error('[ErrorTracking] Captured error:', errorId, errorObj.message, context);
  }

  // In production, this would send to Sentry/backend
  if (CONFIG.enabled) {
    // TODO: Integrate with Sentry or custom error tracking backend
    // Example: Sentry.captureException(errorObj, { extra: context });
  }

  return errorId;
}

/**
 * Capture and report a message (non-error)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  if (CONFIG.debug) {
    console.log(`[ErrorTracking] Message (${level}):`, message, context);
  }

  if (CONFIG.enabled) {
    // TODO: Integrate with error tracking service
  }
}

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const newBreadcrumb: Breadcrumb = {
    ...breadcrumb,
    timestamp: Date.now(),
  };

  breadcrumbs.push(newBreadcrumb);

  // Keep only the last N breadcrumbs
  while (breadcrumbs.length > CONFIG.maxBreadcrumbs) {
    breadcrumbs.shift();
  }

  if (CONFIG.debug) {
    console.debug('[ErrorTracking] Breadcrumb:', newBreadcrumb.message);
  }
}

/**
 * Get current breadcrumb trail (useful for debugging)
 */
export function getBreadcrumbs(): readonly Breadcrumb[] {
  return [...breadcrumbs];
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

/**
 * Set user context for error reports
 */
export function setUserContext(
  user: {
    id?: string;
    email?: string;
    username?: string;
  } | null
): void {
  if (CONFIG.debug && user) {
    console.debug('[ErrorTracking] User context set:', user.id);
  }

  // TODO: In production, set user context in Sentry
  // Example: Sentry.setUser(user);
}

/**
 * Initialize error tracking (call once on app startup)
 */
export function initErrorTracking(): void {
  if (CONFIG.debug) {
    console.debug('[ErrorTracking] Initialized (dev mode - logging only)');
  }

  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureError(event.error || new Error(event.message), {
        component: 'GlobalErrorHandler',
        action: 'uncaught_error',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        component: 'GlobalErrorHandler',
        action: 'unhandled_rejection',
      });
    });
  }
}

export default {
  captureError,
  captureMessage,
  addBreadcrumb,
  getBreadcrumbs,
  clearBreadcrumbs,
  setUserContext,
  initErrorTracking,
};
