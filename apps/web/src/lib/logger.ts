/**
 * Production-safe logger with integrated error tracking
 *
 * - Development: Full logging with stack traces
 * - Production: Sanitized output with error tracking integration
 *
 * Features:
 * - Automatic PII stripping in production
 * - Error tracking service integration (Sentry-compatible)
 * - Breadcrumb trail for debugging
 * - Structured logging with severity levels
 * - Performance timing support
 *
 * @module lib/logger
 * @version 2.0.0
 * @since v0.7.58
 */

import { captureError, captureMessage, addBreadcrumb } from '@/lib/error-tracking';

// Vite provides import.meta.env.DEV - fallback to false for SSR/test environments
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (error: Error | string, ...args: unknown[]) => void;
  /** Time an operation */
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  /** Log with breadcrumb for debugging */
  breadcrumb: (message: string, data?: Record<string, unknown>) => void;
}

const timers: Map<string, number> = new Map();

/**
 * Sanitize arguments for production logging
 * Removes potential PII and sensitive data
 */
function sanitizeForProduction(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `Error: ${arg.name}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        return '[Object]';
      }
      if (typeof arg === 'string' && arg.length > 100) {
        return arg.substring(0, 100) + '...';
      }
      return String(arg);
    })
    .join(' ');
}

/**
 * Creates a namespaced logger with error tracking integration
 * @param namespace - Prefix for log messages (e.g., 'Socket', 'E2EE')
 */
export const createLogger = (namespace: string): Logger => {
  const prefix = `[${namespace}]`;

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },

    info: (...args: unknown[]) => {
      if (isDev) {
        console.info(prefix, ...args);
      }
    },

    log: (...args: unknown[]) => {
      if (isDev) {
        console.log(prefix, ...args);
      }
    },

    warn: (...args: unknown[]) => {
      if (isDev) {
        console.warn(prefix, ...args);
      } else {
        // In production, log sanitized and send to error tracking
        const sanitized = sanitizeForProduction(args);
        console.warn(prefix, 'Warning:', sanitized);
        captureMessage(`${namespace}: ${sanitized}`, 'warning', {
          component: namespace,
        });
      }
    },

    error: (error: Error | string, ...args: unknown[]) => {
      if (isDev) {
        console.error(prefix, error, ...args);
      } else {
        // In production, sanitize and send to error tracking
        const sanitized = sanitizeForProduction(args);
        console.error(prefix, 'Error occurred');
        captureError(error, {
          component: namespace,
          metadata: { additionalInfo: sanitized },
        });
      }
    },

    time: (label: string) => {
      timers.set(`${namespace}:${label}`, performance.now());
    },

    timeEnd: (label: string) => {
      const key = `${namespace}:${label}`;
      const start = timers.get(key);
      if (start) {
        const duration = performance.now() - start;
        timers.delete(key);
        if (isDev) {
          console.debug(prefix, `${label}: ${duration.toFixed(2)}ms`);
        }
        // Track slow operations in production
        if (isProd && duration > 1000) {
          captureMessage(`Slow operation: ${namespace}/${label}`, 'warning', {
            component: namespace,
            metadata: { duration, label },
          });
        }
      }
    },

    breadcrumb: (message: string, data?: Record<string, unknown>) => {
      addBreadcrumb('ui', `${namespace}: ${message}`, data);
      if (isDev) {
        console.debug(prefix, '[Breadcrumb]', message, data || '');
      }
    },
  };
};

// Default logger for general use
export const logger = createLogger('CGraph');

// Pre-configured loggers for common modules
export const socketLogger = createLogger('Socket');
export const e2eeLogger = createLogger('E2EE');
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const forumLogger = createLogger('Forum');
export const chatLogger = createLogger('Chat');
export const themeLogger = createLogger('Theme');
export const gamificationLogger = createLogger('Gamification');
export const routeLogger = createLogger('Route');
