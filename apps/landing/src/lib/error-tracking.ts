/**
 * Error Tracking Utility
 *
 * Lightweight client-side error tracking that captures:
 *   - Unhandled exceptions (window.onerror)
 *   - Unhandled promise rejections
 *   - React ErrorBoundary errors (via reportBoundaryError)
 *
 * Reports errors to:
 *   1. Console (development)
 *   2. Plausible Analytics custom events (production)
 *
 * This is a lightweight alternative to Sentry for marketing sites
 * that don't need full session replay / stack trace aggregation.
 */

interface ErrorReport {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  type: 'error' | 'unhandledrejection' | 'react-boundary';
  url: string;
  timestamp: string;
  userAgent: string;
}

/** Rate limit: max errors reported per session */
const MAX_ERRORS_PER_SESSION = 10;
let errorCount = 0;

/** Deduplicate: track recent error messages */
const recentErrors = new Set<string>();

function shouldReport(message: string): boolean {
  if (errorCount >= MAX_ERRORS_PER_SESSION) return false;
  if (recentErrors.has(message)) return false;
  recentErrors.add(message);
  errorCount++;
  return true;
}

function sendReport(report: ErrorReport): void {
  // Always log in dev
  if (import.meta.env.DEV) {
    console.warn('[ErrorTracker]', report.type, report.message, report);
    return;
  }

  // Production: report to Plausible
  const plausible = (window as unknown as Record<string, unknown>).plausible as
    | ((event: string, options: { props: Record<string, unknown> }) => void)
    | undefined;

  if (typeof plausible === 'function') {
    plausible('Client Error', {
      props: {
        type: report.type,
        message: report.message.slice(0, 200),
        source: report.source || 'unknown',
        url: report.url,
      },
    });
  }
}

/**
 * Report an error from a React ErrorBoundary.
 * Call this from componentDidCatch().
 */
export function reportBoundaryError(error: Error, componentStack?: string): void {
  const message = error.message || String(error);
  if (!shouldReport(message)) return;

  sendReport({
    message,
    stack: error.stack?.slice(0, 1000),
    source: componentStack?.slice(0, 500),
    type: 'react-boundary',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Initialize global error tracking listeners.
 * Call once at app startup.
 */
export function initErrorTracking(): void {
  // Unhandled JS errors
  window.addEventListener('error', (event) => {
    const message = event.message || 'Unknown error';
    if (!shouldReport(message)) return;

    sendReport({
      message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack?.slice(0, 1000),
      type: 'error',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const { reason } = event;
    const message = reason instanceof Error ? reason.message : String(reason);
    if (!shouldReport(message)) return;

    sendReport({
      message,
      stack: reason instanceof Error ? reason.stack?.slice(0, 1000) : undefined,
      type: 'unhandledrejection',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  });
}
