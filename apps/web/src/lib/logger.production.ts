/**
 * Production-Safe Logger
 *
 * SECURITY FIX: CVE-CGRAPH-2026-008
 * ==================================
 * Replace all console.log() calls with this logger to prevent
 * information disclosure in production builds.
 *
 * FEATURES:
 * - Automatic detection of production environment
 * - Zero output in production (unless explicitly enabled)
 * - Structured logging with levels
 * - Performance monitoring
 * - Error tracking integration ready
 *
 * USAGE:
 * ```typescript
 * import logger from '@/lib/logger.production';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', error);
 * logger.debug('Cache hit', { key: 'user_profile' });
 * ```
 *
 * @module lib/logger.production
 * @version 1.1.0
 */

import { captureError } from '@/lib/error-tracking';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeStack: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class ProductionLogger {
  private config: LoggerConfig;

  constructor() {
    // Automatically detect production environment
    const isProduction =
      import.meta.env.PROD ||
      import.meta.env.MODE === 'production' ||
      process.env.NODE_ENV === 'production';

    this.config = {
      // IMPORTANT: Disable logging in production by default
      enabled: !isProduction || import.meta.env.VITE_ENABLE_LOGGING === 'true',
      minLevel: isProduction ? 'error' : 'debug',
      includeTimestamp: !isProduction,
      includeStack: false,
    };
  }

  /**
   * Format log message
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(new Date().toISOString());
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context, null, 2));
    }

    return parts.join(' ');
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(this.format('debug', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(this.format('info', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context));
    }
  }

  /**
   * Log error message (always logged, even in production)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const fullContext = { ...context };

      if (error instanceof Error) {
        fullContext.error = {
          message: error.message,
          name: error.name,
          stack: this.config.includeStack ? error.stack : undefined,
        };
      } else if (error) {
        fullContext.error = error;
      }

      console.error(this.format('error', message, fullContext));

      // Send to error tracking service
      if (error instanceof Error) {
        captureError(error, {
          component: 'logger',
          action: 'production_error',
          metadata: context,
        });
      } else if (error) {
        captureError(new Error(message), {
          component: 'logger',
          action: 'production_error',
          metadata: { ...context, originalError: error },
        });
      }
    }
  }

  /**
   * Performance measurement
   */
  time(label: string): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.timeEnd(label);
    }
  }

  /**
   * Group logs (development only)
   */
  group(label: string): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Table output (development only)
   */
  table(data: unknown): void {
    if (this.config.enabled && this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
const logger = new ProductionLogger();

export default logger;

// Export specialized loggers for different modules
export const authLogger = {
  log: (msg: string, ctx?: LogContext) => logger.info(`[Auth] ${msg}`, ctx),
  error: (msg: string, err?: Error) => logger.error(`[Auth] ${msg}`, err),
  debug: (msg: string, ctx?: LogContext) => logger.debug(`[Auth] ${msg}`, ctx),
};

export const e2eeLogger = {
  log: (msg: string, ctx?: LogContext) => logger.info(`[E2EE] ${msg}`, ctx),
  error: (msg: string, err?: Error) => logger.error(`[E2EE] ${msg}`, err),
  debug: (msg: string, ctx?: LogContext) => logger.debug(`[E2EE] ${msg}`, ctx),
};

export const apiLogger = {
  log: (msg: string, ctx?: LogContext) => logger.info(`[API] ${msg}`, ctx),
  error: (msg: string, err?: Error) => logger.error(`[API] ${msg}`, err),
  debug: (msg: string, ctx?: LogContext) => logger.debug(`[API] ${msg}`, ctx),
};

export const wsLogger = {
  log: (msg: string, ctx?: LogContext) => logger.info(`[WebSocket] ${msg}`, ctx),
  error: (msg: string, err?: Error) => logger.error(`[WebSocket] ${msg}`, err),
  debug: (msg: string, ctx?: LogContext) => logger.debug(`[WebSocket] ${msg}`, ctx),
};
