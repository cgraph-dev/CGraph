/**
 * CGraph Observability Client
 *
 * Unified observability SDK for frontend error tracking, performance monitoring,
 * and user session analytics across web and mobile platforms.
 *
 * @module @cgraph/observability
 */

// =============================================================================
// Types
// =============================================================================

export interface ObservabilityConfig {
  /** Sentry DSN for error tracking */
  sentryDsn?: string;
  /** Environment name */
  environment: 'development' | 'staging' | 'production';
  /** Application version */
  release?: string;
  /** Enable performance monitoring */
  enablePerformance?: boolean;
  /** Enable session replay */
  enableSessionReplay?: boolean;
  /** Sample rate for error events (0-1) */
  errorSampleRate?: number;
  /** Sample rate for performance traces (0-1) */
  traceSampleRate?: number;
  /** Enable console logging in development */
  enableConsoleLogging?: boolean;
  /** Custom tags to add to all events */
  tags?: Record<string, string>;
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
  tier?: 'free' | 'premium' | 'enterprise';
  [key: string]: unknown;
}

export interface BreadcrumbData {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface PerformanceSpan {
  name: string;
  op: string;
  startTime: number;
  endTime?: number;
  data?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// =============================================================================
// Observability Client
// =============================================================================

class ObservabilityClient {
  private config: ObservabilityConfig | null = null;
  private userContext: UserContext | null = null;
  private isInitialized = false;
  private breadcrumbs: BreadcrumbData[] = [];
  private activeSpans: Map<string, PerformanceSpan> = new Map();

  /**
   * Initialize observability with configuration
   */
  init(config: ObservabilityConfig): void {
    this.config = {
      errorSampleRate: 1.0,
      traceSampleRate: 0.2,
      enablePerformance: true,
      enableSessionReplay: config.environment === 'production',
      enableConsoleLogging: config.environment === 'development',
      ...config,
    };

    // In production, integrate with actual Sentry SDK
    if (this.config.sentryDsn && typeof window !== 'undefined') {
      this.initSentry();
    }

    // Setup global error handlers
    this.setupErrorHandlers();

    // Setup performance observer
    if (this.config.enablePerformance) {
      this.setupPerformanceObserver();
    }

    this.isInitialized = true;
    this.log('info', 'Observability initialized', { config: this.sanitizeConfig(config) });
  }

  /**
   * Set user context for all events
   */
  setUser(user: UserContext | null): void {
    this.userContext = user;

    if (user) {
      this.log('debug', 'User context set', { userId: user.id });
    } else {
      this.log('debug', 'User context cleared');
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error, context?: Record<string, unknown>): string {
    const eventId = this.generateEventId();

    const errorData = {
      eventId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      user: this.userContext,
      breadcrumbs: this.breadcrumbs.slice(-20),
      timestamp: new Date().toISOString(),
      environment: this.config?.environment,
      release: this.config?.release,
      tags: this.config?.tags,
    };

    // Log to console in development
    if (this.config?.enableConsoleLogging) {
      console.error('[Observability] Error captured:', errorData);
    }

    // Sample based on rate
    if (Math.random() < (this.config?.errorSampleRate ?? 1.0)) {
      this.sendToBackend('/api/observability/errors', errorData);
    }

    return eventId;
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: LogLevel = 'info', context?: Record<string, unknown>): string {
    const eventId = this.generateEventId();

    // Store message data for potential future transmission
    const _messageData = {
      eventId,
      message,
      level,
      context,
      user: this.userContext,
      timestamp: new Date().toISOString(),
      environment: this.config?.environment,
      tags: this.config?.tags,
    };
    void _messageData; // Suppress unused variable warning

    if (this.config?.enableConsoleLogging) {
      const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleFn(`[Observability] ${level.toUpperCase()}:`, message, context);
    }

    return eventId;
  }

  /**
   * Add a breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: BreadcrumbData): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      level: breadcrumb.level ?? 'info',
    });

    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs = this.breadcrumbs.slice(-100);
    }
  }

  /**
   * Start a performance span
   */
  startSpan(name: string, op: string, data?: Record<string, unknown>): string {
    const spanId = this.generateSpanId();

    this.activeSpans.set(spanId, {
      name,
      op,
      startTime: performance.now(),
      data,
    });

    return spanId;
  }

  /**
   * End a performance span
   */
  endSpan(spanId: string, data?: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    if (data) {
      span.data = { ...span.data, ...data };
    }

    const duration = span.endTime - span.startTime;

    // Sample based on trace rate
    if (this.config?.enablePerformance && Math.random() < (this.config?.traceSampleRate ?? 0.2)) {
      this.sendToBackend('/api/observability/traces', {
        spanId,
        ...span,
        duration,
        user: this.userContext?.id,
        timestamp: new Date().toISOString(),
      });
    }

    this.activeSpans.delete(spanId);
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, referrer?: string): void {
    this.addBreadcrumb({
      category: 'navigation',
      message: `Page view: ${path}`,
      data: { path, referrer },
    });

    if (this.config?.enablePerformance) {
      this.sendToBackend('/api/observability/pageviews', {
        path,
        referrer,
        user: this.userContext?.id,
        timestamp: new Date().toISOString(),
        performance: this.getWebVitals(),
      });
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    this.addBreadcrumb({
      category: 'event',
      message: name,
      data: properties,
    });

    this.sendToBackend('/api/observability/events', {
      name,
      properties,
      user: this.userContext?.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user timing
   */
  trackTiming(category: string, variable: string, timeMs: number, label?: string): void {
    this.sendToBackend('/api/observability/timing', {
      category,
      variable,
      timeMs,
      label,
      user: this.userContext?.id,
      timestamp: new Date().toISOString(),
    });
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private initSentry(): void {
    // Placeholder for Sentry initialization
    // In production, this would use @sentry/react or @sentry/react-native
    this.log('debug', 'Sentry would be initialized here with DSN');
  }

  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.onerror = (_message, source, lineno, colno, error) => {
        if (error) {
          this.captureError(error, { source, lineno, colno });
        }
        return false;
      };

      // Unhandled promise rejection handler
      window.onunhandledrejection = (event) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
        this.captureError(error, { type: 'unhandledrejection' });
      };
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.addBreadcrumb({
              category: 'performance',
              message: 'Long task detected',
              level: 'warning',
              data: { duration: entry.duration },
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Observe layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { value: number };
          if (layoutShift.value > 0.1) {
            this.addBreadcrumb({
              category: 'performance',
              message: 'Layout shift detected',
              level: 'warning',
              data: { value: layoutShift.value },
            });
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (_e) {
      // Performance observer not supported
    }
  }

  private getWebVitals(): Record<string, number> | null {
    if (typeof performance === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!navigation) return null;

    return {
      ttfb: navigation.responseStart - navigation.requestStart,
      fcp: this.getFCP(),
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      load: navigation.loadEventEnd - navigation.startTime,
    };
  }

  private getFCP(): number {
    const paint = performance.getEntriesByType('paint').find(
      (entry) => entry.name === 'first-contentful-paint'
    );
    return paint?.startTime ?? 0;
  }

  private async sendToBackend(endpoint: string, data: unknown): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Use sendBeacon for reliability, fallback to fetch
      const payload = JSON.stringify(data);

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, payload);
      } else if (typeof fetch !== 'undefined') {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      }
    } catch (error) {
      // Silently fail - we don't want observability to break the app
      if (this.config?.enableConsoleLogging) {
        console.warn('[Observability] Failed to send data:', error);
      }
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (this.config?.enableConsoleLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Observability] ${level.toUpperCase()}: ${message}`, data ?? '');
    }
  }

  private sanitizeConfig(config: ObservabilityConfig): Partial<ObservabilityConfig> {
    // Remove sensitive data from config for logging
    const { sentryDsn, ...safe } = config;
    return { ...safe, sentryDsn: sentryDsn ? '[REDACTED]' : undefined };
  }

  private generateEventId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const observability = new ObservabilityClient();

// =============================================================================
// React Hooks (for web)
// =============================================================================

export function useTrackPageView(path: string): void {
  // Would use useEffect in actual React implementation
  observability.trackPageView(path);
}

export function useTrackEvent() {
  return (name: string, properties?: Record<string, unknown>) => {
    observability.trackEvent(name, properties);
  };
}

// =============================================================================
// Error Boundary Helper
// =============================================================================

export function captureComponentError(
  error: Error,
  componentStack: string,
  componentName?: string
): string {
  return observability.captureError(error, {
    componentStack,
    componentName,
    type: 'react-error-boundary',
  });
}
