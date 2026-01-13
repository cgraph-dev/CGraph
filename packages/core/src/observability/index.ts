/**
 * Observability Module
 *
 * Unified exports for error tracking, logging, and performance monitoring.
 */

export {
  observability,
  captureComponentError,
  useTrackPageView,
  useTrackEvent,
  type ObservabilityConfig,
  type UserContext,
  type BreadcrumbData,
  type PerformanceSpan,
} from './client';

export {
  logger,
  createLogger,
  logRequest,
  type LogLevel,
  type LogContext,
  type LoggerConfig,
  type LogEntry,
  type RequestLogContext,
} from './logger';
