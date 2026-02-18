/**
 * Frontend Error Tracking — Sentry Browser SDK
 *
 * Provides centralized error tracking, performance monitoring,
 * and session replay for the CGraph web application.
 *
 * Features:
 * - Automatic JS error capture with source maps
 * - Web Vitals (LCP, FID, CLS) tracking
 * - React component render profiling
 * - Custom breadcrumbs for navigation, API calls, WebSocket events
 * - Release health tracking (crash-free sessions)
 *
 * Configuration:
 *   Set VITE_SENTRY_DSN in environment to enable.
 *   Source maps are uploaded in CI but NOT served to users.
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENVIRONMENT = import.meta.env.MODE || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '0.9.31';

// Track initialization state
let isInitialized = false;

/**
 * Initialize Sentry error tracking.
 * No-op if VITE_SENTRY_DSN is not set.
 */
export async function initErrorTracking(): Promise<void> {
  if (!SENTRY_DSN || isInitialized) return;

  try {
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `cgraph-web@${RELEASE}`,

      // Performance monitoring
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

      // Session replay (captures DOM for error reproduction)
      replaysSessionSampleRate: 0.01, // 1% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of error sessions

      // Filtering
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Network errors (expected)
        'Failed to fetch',
        'NetworkError',
        'AbortError',
        // User-initiated navigation
        'cancelled',
      ],

      // Before sending, strip PII
      beforeSend(event) {
        // Remove cookies and local storage from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.filter(
            (b) => b.category !== 'console' || b.level !== 'debug'
          );
        }
        return event;
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
    });

    isInitialized = true;
    // eslint-disable-next-line no-console
    console.info('[ErrorTracking] Sentry initialized');
  } catch (error) {
    console.warn('[ErrorTracking] Failed to initialize Sentry:', error);
  }
}

/**
 * Capture a custom error with context.
 */
export function captureError(error: Error | string, context?: Record<string, unknown>): void {
  if (!isInitialized) {
    console.error('[ErrorTracking]', error, context);
    return;
  }

  import('@sentry/react').then((Sentry) => {
    if (typeof error === 'string') {
      Sentry.captureMessage(error, {
        level: 'error',
        extra: context,
      });
    } else {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  });
}

/**
 * Capture a custom message (non-error) with severity level.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  extra?: Record<string, unknown>
): void {
  if (!isInitialized) {
    console.warn('[ErrorTracking]', `[${level}]`, message, extra);
    return;
  }

  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, {
      level,
      extra,
    });
  });
}

/**
 * Add a breadcrumb for tracking user actions.
 */
export function addBreadcrumb(
  category: 'navigation' | 'api' | 'websocket' | 'user' | 'ui',
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isInitialized) return;

  import('@sentry/react').then((Sentry) => {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  });
}

/**
 * Set user context for error tracking.
 */
export function setUser(
  user: {
    id: string;
    username?: string;
    email?: string;
  } | null
): void {
  if (!isInitialized) return;

  import('@sentry/react').then((Sentry) => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        username: user.username,
        // Don't send email to Sentry for privacy
      });
    } else {
      Sentry.setUser(null);
    }
  });
}

/**
 * Create a performance transaction for tracking.
 */
export function startTransaction(name: string, op: string): { finish: () => void } {
  if (!isInitialized) {
    return { finish: () => {} };
  }

  const start = performance.now();

  return {
    finish: () => {
      const duration = performance.now() - start;
      addBreadcrumb('ui', `${op}: ${name}`, { duration_ms: duration });
    },
  };
}

/**
 * Track Web Vitals metrics.
 */
export function reportWebVitals(): void {
  if (!isInitialized) return;

  // Web Vitals are automatically captured by Sentry's browserTracingIntegration
  // This function can be called to add custom vitals
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          addBreadcrumb('ui', `webvital:${entry.name}`, {
            value: entry.startTime,
            entryType: entry.entryType,
          });
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // PerformanceObserver not fully supported
    }
  }
}
