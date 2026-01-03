/**
 * Production-safe logger
 * Only logs in development mode to prevent sensitive data leakage
 */

const isDev = import.meta.env.DEV;

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Creates a namespaced logger
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
      // Warnings always logged, but sanitized in production
      if (isDev) {
        console.warn(prefix, ...args);
      } else {
        console.warn(prefix, 'Warning occurred');
      }
    },
    error: (...args: unknown[]) => {
      // Errors always logged for debugging, but sanitized in production
      if (isDev) {
        console.error(prefix, ...args);
      } else {
        // In production, log without sensitive details
        console.error(prefix, 'An error occurred');
        // TODO: Send to error tracking service (Sentry, etc.)
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
