/**
 * Error Tracking Service
 * 
 * Production-ready error tracking infrastructure that integrates with
 * external services like Sentry, LogRocket, or custom backends.
 * 
 * Features:
 * - Automatic error capture with context
 * - User context enrichment
 * - Performance transaction tracking
 * - Breadcrumb trail for debugging
 * - Rate limiting to prevent flooding
 * - PII stripping for privacy compliance
 * - Offline error queuing with retry
 * 
 * @module lib/errorTracking
 * @version 1.0.0
 * @since v0.7.58
 */

import { api } from '@/lib/api';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** User action that triggered the error */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Stack trace (auto-captured for Error objects) */
  stack?: string;
  /** Error severity level */
  level?: 'fatal' | 'error' | 'warning' | 'info';
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** Extra context data */
  extra?: Record<string, unknown>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  isPremium?: boolean;
}

export interface Breadcrumb {
  /** Timestamp of the event */
  timestamp: number;
  /** Category of breadcrumb */
  category: 'navigation' | 'http' | 'ui' | 'console' | 'error' | 'user' | 'websocket';
  /** Human-readable message */
  message: string;
  /** Breadcrumb level */
  level?: 'debug' | 'info' | 'warning' | 'error';
  /** Additional data */
  data?: Record<string, unknown>;
}

interface QueuedError {
  id: string;
  error: string;
  context: ErrorContext;
  userContext: UserContext | null;
  breadcrumbs: Breadcrumb[];
  timestamp: number;
  retryCount: number;
  url: string;
  userAgent: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Maximum breadcrumbs to keep in memory */
  maxBreadcrumbs: 50,
  /** Rate limit: max errors per minute */
  maxErrorsPerMinute: 10,
  /** Queue retry interval (ms) */
  retryInterval: 60000,
  /** Max retry attempts per error */
  maxRetries: 3,
  /** Error endpoint (if using custom backend) */
  errorEndpoint: '/api/v1/telemetry/errors',
  /** Enable/disable error tracking */
  enabled: import.meta.env.PROD,
  /** Debug mode (logs to console instead of sending) */
  debug: import.meta.env.DEV,
  /** Sentry DSN (if using Sentry) */
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
};

// ============================================================================
// State
// ============================================================================

let userContext: UserContext | null = null;
const breadcrumbs: Breadcrumb[] = [];
const errorQueue: QueuedError[] = [];
let errorCount = 0;
let errorCountResetTime = Date.now();
let isProcessingQueue = false;

// ============================================================================
// PII Stripping & Sanitization
// ============================================================================

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'social_security',
  'private_key',
  'privatekey',
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

/**
 * Strip PII from a string value
 */
function stripPiiFromString(value: string): string {
  return value
    .replace(EMAIL_REGEX, '[EMAIL]')
    .replace(PHONE_REGEX, '[PHONE]')
    .replace(IP_REGEX, '[IP]')
    .replace(JWT_REGEX, '[JWT]');
}

/**
 * Recursively strip PII from an object
 */
function stripPii(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return stripPiiFromString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stripPii(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = stripPii(value, depth + 1);
      }
    }
    return result;
  }
  
  return obj;
}

// ============================================================================
// Breadcrumb Management
// ============================================================================

/**
 * Add a breadcrumb to the trail
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const crumb: Breadcrumb = {
    ...breadcrumb,
    timestamp: Date.now(),
  };
  
  breadcrumbs.push(crumb);
  
  // Keep only the most recent breadcrumbs
  if (breadcrumbs.length > CONFIG.maxBreadcrumbs) {
    breadcrumbs.shift();
  }
  
  if (CONFIG.debug) {
    console.debug('[ErrorTracking] Breadcrumb:', crumb);
  }
}

/**
 * Clear all breadcrumbs
 */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

// ============================================================================
// User Context Management
// ============================================================================

/**
 * Set the current user context for error enrichment
 */
export function setUser(context: UserContext | null): void {
  userContext = context;
  
  if (CONFIG.debug) {
    console.debug('[ErrorTracking] User context set:', context ? { id: context.id } : null);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  userContext = null;
}

// ============================================================================
// Rate Limiting
// ============================================================================

function isRateLimited(): boolean {
  const now = Date.now();
  
  // Reset counter every minute
  if (now - errorCountResetTime > 60000) {
    errorCount = 0;
    errorCountResetTime = now;
  }
  
  if (errorCount >= CONFIG.maxErrorsPerMinute) {
    if (CONFIG.debug) {
      console.warn('[ErrorTracking] Rate limit exceeded, error not tracked');
    }
    return true;
  }
  
  errorCount++;
  return false;
}

// ============================================================================
// Error Queue Management (Offline Support)
// ============================================================================

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue || errorQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    const errors = [...errorQueue];
    
    for (const queuedError of errors) {
      if (queuedError.retryCount >= CONFIG.maxRetries) {
        // Remove after max retries
        const index = errorQueue.indexOf(queuedError);
        if (index > -1) errorQueue.splice(index, 1);
        continue;
      }
      
      try {
        await sendErrorToBackend(queuedError);
        // Remove on success
        const index = errorQueue.indexOf(queuedError);
        if (index > -1) errorQueue.splice(index, 1);
      } catch {
        queuedError.retryCount++;
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

async function sendErrorToBackend(error: QueuedError): Promise<void> {
  // If Sentry is configured, send there too
  if (CONFIG.sentryDsn && typeof window !== 'undefined') {
    // Dynamic import to avoid bundling Sentry when not used
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureException(new Error(error.error), {
        tags: error.context.tags,
        extra: {
          ...error.context.extra,
          breadcrumbs: error.breadcrumbs,
        },
        user: error.userContext ? { id: error.userContext.id } : undefined,
      });
    } catch {
      // Sentry not installed, continue with custom backend
    }
  }
  
  // Send to our backend
  await api.post(CONFIG.errorEndpoint, {
    error_id: error.id,
    message: error.error,
    level: error.context.level || 'error',
    component: error.context.component,
    action: error.context.action,
    metadata: stripPii(error.context.metadata),
    tags: error.context.tags,
    breadcrumbs: error.breadcrumbs.slice(-20), // Last 20 breadcrumbs
    user_id: error.userContext?.id,
    url: error.url,
    user_agent: error.userAgent,
    timestamp: new Date(error.timestamp).toISOString(),
  });
}

// ============================================================================
// Main Error Capture Functions
// ============================================================================

/**
 * Capture an error with context
 */
export function captureError(
  error: Error | string,
  context: ErrorContext = {}
): string | null {
  if (!CONFIG.enabled && !CONFIG.debug) return null;
  if (isRateLimited()) return null;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const errorId = generateErrorId();
  
  const queuedError: QueuedError = {
    id: errorId,
    error: stripPiiFromString(errorMessage),
    context: {
      ...context,
      stack: errorStack ? stripPiiFromString(errorStack) : undefined,
      level: context.level || 'error',
    },
    userContext: userContext ? { ...userContext } : null,
    breadcrumbs: [...breadcrumbs],
    timestamp: Date.now(),
    retryCount: 0,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
  
  if (CONFIG.debug) {
    console.error('[ErrorTracking] Captured error:', {
      id: errorId,
      error: errorMessage,
      context: context,
    });
    return errorId;
  }
  
  // Queue for sending
  errorQueue.push(queuedError);
  
  // Try to send immediately
  processQueue().catch(() => {
    // Will retry later
  });
  
  return errorId;
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context: Omit<ErrorContext, 'level'> = {}
): string | null {
  return captureError(message, { ...context, level });
}

/**
 * Capture a fatal error (app crash)
 */
export function captureFatal(
  error: Error,
  context: Omit<ErrorContext, 'level'> = {}
): string | null {
  return captureError(error, { ...context, level: 'fatal' });
}

// ============================================================================
// Performance Transaction Tracking
// ============================================================================

interface Transaction {
  name: string;
  startTime: number;
  spans: { name: string; startTime: number; endTime?: number }[];
}

const activeTransactions: Map<string, Transaction> = new Map();

/**
 * Start a performance transaction
 */
export function startTransaction(name: string): string {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  activeTransactions.set(txId, {
    name,
    startTime: performance.now(),
    spans: [],
  });
  
  return txId;
}

/**
 * Add a span to an active transaction
 */
export function startSpan(txId: string, spanName: string): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;
  
  tx.spans.push({
    name: spanName,
    startTime: performance.now(),
  });
}

/**
 * End the current span in a transaction
 */
export function endSpan(txId: string): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;
  
  const currentSpan = tx.spans[tx.spans.length - 1];
  if (currentSpan && !currentSpan.endTime) {
    currentSpan.endTime = performance.now();
  }
}

/**
 * Finish a transaction and optionally report it
 */
export function finishTransaction(txId: string, report = false): void {
  const tx = activeTransactions.get(txId);
  if (!tx) return;
  
  const duration = performance.now() - tx.startTime;
  
  if (CONFIG.debug) {
    console.debug('[ErrorTracking] Transaction finished:', {
      name: tx.name,
      duration: `${duration.toFixed(2)}ms`,
      spans: tx.spans.map(s => ({
        name: s.name,
        duration: s.endTime ? `${(s.endTime - s.startTime).toFixed(2)}ms` : 'incomplete',
      })),
    });
  }
  
  if (report && CONFIG.enabled) {
    // Report slow transactions
    if (duration > 3000) {
      captureMessage(`Slow transaction: ${tx.name}`, 'warning', {
        component: 'performance',
        metadata: { duration, spanCount: tx.spans.length },
        tags: { type: 'slow_transaction' },
      });
    }
  }
  
  activeTransactions.delete(txId);
}

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Initialize global error handlers
 */
export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Unhandled errors
  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, {
      component: 'global',
      action: 'unhandled_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    
    captureError(error, {
      component: 'global',
      action: 'unhandled_rejection',
    });
  });
  
  // Track navigation
  if ('navigation' in performance) {
    addBreadcrumb({
      category: 'navigation',
      message: 'Page loaded',
      data: { url: window.location.href },
    });
  }
  
  // Start queue processor
  setInterval(processQueue, CONFIG.retryInterval);
  
  if (CONFIG.debug) {
    console.info('[ErrorTracking] Initialized');
  }
}

// ============================================================================
// React Integration Helpers
// ============================================================================

/**
 * HOC for capturing errors in React components
 */
export function withErrorTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function ErrorTrackedComponent(props: P) {
    try {
      return <WrappedComponent {...props} />;
    } catch (error) {
      captureError(error as Error, {
        component: componentName,
        action: 'render_error',
      });
      throw error;
    }
  };
}

/**
 * Hook for manual error capture in components
 */
export function useErrorTracking(componentName: string) {
  return {
    captureError: (error: Error | string, action?: string) =>
      captureError(error, { component: componentName, action }),
    addBreadcrumb: (message: string, data?: Record<string, unknown>) =>
      addBreadcrumb({ category: 'ui', message, data }),
  };
}

// ============================================================================
// Export Singleton
// ============================================================================

const errorTracking = {
  init: initErrorTracking,
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
