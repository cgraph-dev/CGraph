/**
 * Error Tracking Service
 *
 * Production-ready error tracking with automatic capture, PII stripping,
 * offline queuing, performance transactions, and React integration.
 *
 * @module lib/error-tracking
 *
 * @example
 * ```ts
 * import { captureError, addBreadcrumb } from '@/lib/error-tracking';
 *
 * addBreadcrumb({ category: 'ui', message: 'Button clicked' });
 * captureError(new Error('Something failed'), { component: 'MyPage' });
 * ```
 */

// ── Imports (for local use in init/cleanup/singleton) ──────────────────
import { CONFIG } from './config';
import {
  captureError,
  captureMessage,
  captureFatal,
  setUser,
  clearUser,
  processQueue,
} from './queue';
import { addBreadcrumb, clearBreadcrumbs, getBreadcrumbs } from './breadcrumbs';
import { startTransaction, startSpan, endSpan, finishTransaction } from './transactions';
import { withErrorTracking, useErrorTracking } from './react';

// ── Type Re-exports ────────────────────────────────────────────────────
export type { ErrorContext, UserContext, Breadcrumb, QueuedError, Transaction } from './types';

// ── Core API Re-exports ────────────────────────────────────────────────
export { captureError, captureMessage, captureFatal, setUser, clearUser, processQueue };
export { addBreadcrumb, clearBreadcrumbs, getBreadcrumbs };

// ── Performance Tracking Re-exports ────────────────────────────────────
export { startTransaction, startSpan, endSpan, finishTransaction };

// ── React Helpers Re-exports ───────────────────────────────────────────
export { withErrorTracking, useErrorTracking };

// ── PII Utilities Re-exports ───────────────────────────────────────────
export { stripPii, stripPiiFromString } from './pii';

// ── Configuration Re-export ────────────────────────────────────────────
export { CONFIG };

// ── Global Handlers ────────────────────────────────────────────────────

let queueProcessorInterval: ReturnType<typeof setInterval> | null = null;
let globalErrorHandler: ((event: ErrorEvent) => void) | null = null;
let globalRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
let isInitialized = false;

/**
 * Initialize global error handlers.
 * Installs window-level error/rejection listeners and starts
 * the offline queue processor interval.
 */
export function initErrorTracking(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  globalErrorHandler = (event: ErrorEvent) => {
    captureError(event.error || event.message, {
      component: 'global',
      action: 'unhandled_error',
      metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  };
  window.addEventListener('error', globalErrorHandler);

  globalRejectionHandler = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureError(error, { component: 'global', action: 'unhandled_rejection' });
  };
  window.addEventListener('unhandledrejection', globalRejectionHandler);

  if ('navigation' in performance) {
    addBreadcrumb({
      category: 'navigation',
      message: 'Page loaded',
      data: { url: window.location.href },
    });
  }

  // Adaptive queue processing — 60s active, 240s when tab hidden
  const startQueueProcessor = () => {
    if (queueProcessorInterval) clearInterval(queueProcessorInterval);
    const delay = document.hidden ? CONFIG.retryInterval * 4 : CONFIG.retryInterval;
    queueProcessorInterval = setInterval(processQueue, delay);
  };

  startQueueProcessor();
  document.addEventListener('visibilitychange', startQueueProcessor);
  // eslint-disable-next-line no-console
  if (CONFIG.debug) console.info('[ErrorTracking] Initialized');
}

/**
 * Cleanup error tracking handlers and intervals.
 * Removes window listeners and clears the queue processor.
 * Call on app unmount or in test teardown.
 */
export function cleanupErrorTracking(): void {
  if (typeof window === 'undefined') return;

  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
    queueProcessorInterval = null;
  }
  if (globalErrorHandler) {
    window.removeEventListener('error', globalErrorHandler);
    globalErrorHandler = null;
  }
  if (globalRejectionHandler) {
    window.removeEventListener('unhandledrejection', globalRejectionHandler);
    globalRejectionHandler = null;
  }

  isInitialized = false;
  // eslint-disable-next-line no-console
  if (CONFIG.debug) console.info('[ErrorTracking] Cleaned up');
}

// ── Default Singleton Export ───────────────────────────────────────────

/** Convenience singleton grouping all error tracking methods */
const errorTracking = {
  init: initErrorTracking,
  cleanup: cleanupErrorTracking,
  captureError,
  captureMessage,
  captureFatal,
  addBreadcrumb,
  clearBreadcrumbs,
  setUser,
  clearUser,
  startTransaction,
  startSpan,
  endSpan,
  finishTransaction,
  withErrorTracking,
  useErrorTracking,
};

export default errorTracking;
