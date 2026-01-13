/**
 * Structured Logger
 *
 * Production-grade logging utility with structured output, log levels,
 * and integration with observability systems.
 *
 * @module @cgraph/core/logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Service/component name */
  service: string;
  /** Environment */
  environment: 'development' | 'staging' | 'production';
  /** Enable JSON output (for production log aggregators) */
  jsonOutput: boolean;
  /** Enable colored output (for development) */
  coloredOutput: boolean;
  /** Custom log handler */
  handler?: (entry: LogEntry) => void;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      service: 'cgraph',
      environment: 'development',
      jsonOutput: false,
      coloredOutput: true,
      ...config,
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    const originalHandler = this.config.handler;
    
    childLogger.config.handler = (entry) => {
      entry.context = { ...context, ...entry.context };
      if (originalHandler) {
        originalHandler(entry);
      }
    };
    
    return childLogger;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (errorOrContext instanceof Error) {
      this.log('error', message, context, errorOrContext);
    } else {
      this.log('error', message, errorOrContext);
    }
  }

  /**
   * Log with timing information
   */
  time<T>(label: string, fn: () => T, context?: LogContext): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { ...context, durationMs: duration.toFixed(2) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, error as Error, { ...context, durationMs: duration.toFixed(2) });
      throw error;
    }
  }

  /**
   * Log with async timing
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { ...context, durationMs: duration.toFixed(2) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, error as Error, { ...context, durationMs: duration.toFixed(2) });
      throw error;
    }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Check if we should log at this level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Call custom handler if provided
    if (this.config.handler) {
      this.config.handler(entry);
    }

    // Output to console
    this.output(entry);
  }

  private output(entry: LogEntry): void {
    if (this.config.jsonOutput) {
      // JSON output for log aggregators (ELK, CloudWatch, etc.)
      const output = JSON.stringify(entry);
      console.log(output);
    } else {
      // Human-readable output for development
      const { timestamp, level, message, service, context, error } = entry;
      
      let prefix = `[${timestamp}] [${service}] ${level.toUpperCase().padEnd(5)}`;
      
      if (this.config.coloredOutput) {
        const color = LEVEL_COLORS[level];
        prefix = `${color}${prefix}${RESET_COLOR}`;
      }

      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const output = `${prefix} ${message}${contextStr}`;

      switch (level) {
        case 'error':
          console.error(output);
          if (error?.stack) {
            console.error(error.stack);
          }
          break;
        case 'warn':
          console.warn(output);
          break;
        default:
          console.log(output);
      }
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

// =============================================================================
// Default Logger
// =============================================================================

export const logger = createLogger({
  service: 'cgraph',
  level: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'info' : 'debug',
  jsonOutput: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
  coloredOutput: typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production',
});

// =============================================================================
// Request Logger Middleware Helper
// =============================================================================

export interface RequestLogContext {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export function logRequest(context: RequestLogContext): void {
  const level: LogLevel = context.statusCode >= 500 ? 'error' 
    : context.statusCode >= 400 ? 'warn' 
    : 'info';

  logger[level](`${context.method} ${context.path} ${context.statusCode}`, {
    ...context,
  });
}
