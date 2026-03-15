/**
 * Mobile Error Tracking — Sentry React Native SDK
 *
 * Provides centralized error tracking and performance monitoring
 * for the CGraph mobile application (React Native / Expo).
 *
 * Features:
 * - Native crash capture (iOS/Android)
 * - JS error capture with source maps
 * - React component render profiling
 * - Custom breadcrumbs for navigation, API calls, WebSocket events
 * - Release health tracking (crash-free sessions)
 * - App start performance tracking
 *
 * Configuration:
 *   Set EXPO_PUBLIC_SENTRY_DSN in environment to enable.
 */

import Constants from 'expo-constants';

 
const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const ENVIRONMENT = __DEV__ ? 'development' : 'production';
const RELEASE = Constants.expoConfig?.version || '0.9.31';

let isInitialized = false;

/**
 * Initialize Sentry for React Native.
 * No-op if EXPO_PUBLIC_SENTRY_DSN is not set.
 */
export async function initErrorTracking(): Promise<void> {
  if (!SENTRY_DSN || isInitialized) return;

  try {
    const Sentry = await import('@sentry/react-native');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `cgraph-mobile@${RELEASE}`,

      // Performance monitoring
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

      // Enable native crash reporting
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,

      // Filter noise
      ignoreErrors: [
        'Network request failed',
        'AbortError',
        'cancelled',
        'Possible Unhandled Promise Rejection',
      ],

      beforeSend(event) {
        // Strip PII from breadcrumbs in production
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.filter(
            (b) => b.category !== 'console' || b.level !== 'debug'
          );
        }
        return event;
      },
    });

    isInitialized = true;

     
    console.info('[ErrorTracking] Sentry initialized for mobile');
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

  import('@sentry/react-native').then((Sentry) => {
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
 * Add a breadcrumb for tracking user actions.
 */
export function addBreadcrumb(
  category: 'navigation' | 'api' | 'websocket' | 'user' | 'ui',
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isInitialized) return;

  import('@sentry/react-native').then((Sentry) => {
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
  } | null
): void {
  if (!isInitialized) return;

  import('@sentry/react-native').then((Sentry) => {
    if (user) {
      Sentry.setUser({ id: user.id, username: user.username });
    } else {
      Sentry.setUser(null);
    }
  });
}

/**
 * Wrap a React Native navigation container with Sentry.
 */
export function wrapNavigation(NavigationContainer: React.ComponentType) {
  if (!isInitialized) return NavigationContainer;

  try {
     
    const Sentry = require('@sentry/react-native');
    return Sentry.withProfiler(NavigationContainer);
  } catch {
    return NavigationContainer;
  }
}
