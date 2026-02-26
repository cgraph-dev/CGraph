/**
 * Error Queue & Backend Transport
 *
 * Manages offline error queuing with automatic retry,
 * rate limiting, and backend submission.
 *
 * @module lib/error-tracking/queue
 */

import { api } from '@/lib/api';
import type { ErrorContext, UserContext, QueuedError } from './types';
import { CONFIG } from './config';
import { stripPii, stripPiiFromString } from './pii';
import { getBreadcrumbs } from './breadcrumbs';

// ── State ──────────────────────────────────────────────────────────────
const errorQueue: QueuedError[] = [];
let errorCount = 0;
let errorCountResetTime = Date.now();
let isProcessingQueue = false;
let userContext: UserContext | null = null;

// ── User Context ───────────────────────────────────────────────────────

/** Set the current user context for error enrichment */
export function setUser(context: UserContext | null): void {
  userContext = context;
  if (CONFIG.debug) {
    // eslint-disable-next-line no-console
    console.debug('[ErrorTracking] User context set:', context ? { id: context.id } : null);
  }
}

/** Clear user context (on logout) */
export function clearUser(): void {
  userContext = null;
}

// ── Rate Limiting ──────────────────────────────────────────────────────

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - errorCountResetTime > 60000) {
    errorCount = 0;
    errorCountResetTime = now;
  }
  if (errorCount >= CONFIG.maxErrorsPerMinute) {
    if (CONFIG.debug) console.warn('[ErrorTracking] Rate limit exceeded');
    return true;
  }
  errorCount++;
  return false;
}

// ── Queue Processing ───────────────────────────────────────────────────

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function sendErrorToBackend(error: QueuedError): Promise<void> {
  try {
    await api.post(CONFIG.errorEndpoint, {
      error_id: error.id,
      message: error.error,
      level: error.context.level || 'error',
      component: error.context.component,
      action: error.context.action,
      metadata: stripPii(error.context.metadata),
      tags: error.context.tags,
      breadcrumbs: error.breadcrumbs.slice(-20),
      user_id: error.userContext?.id,
      url: error.url,
      user_agent: error.userAgent,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  } catch (e) {
    console.warn('[ErrorTracking] Failed to send error to backend:', e);
  }
}

/** Process queued errors with retry logic */
export async function processQueue(): Promise<void> {
  if (isProcessingQueue || errorQueue.length === 0) return;
  isProcessingQueue = true;

  try {
    const errors = [...errorQueue];
    for (const queuedError of errors) {
      if (queuedError.retryCount >= CONFIG.maxRetries) {
        const idx = errorQueue.indexOf(queuedError);
        if (idx > -1) errorQueue.splice(idx, 1);
        continue;
      }
      try {
        await sendErrorToBackend(queuedError);
        const idx = errorQueue.indexOf(queuedError);
        if (idx > -1) errorQueue.splice(idx, 1);
      } catch {
        queuedError.retryCount++;
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

// ── Capture Functions ──────────────────────────────────────────────────

/** Capture an error with context */
export function captureError(error: Error | string, context: ErrorContext = {}): string | null {
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
    breadcrumbs: getBreadcrumbs(),
    timestamp: Date.now(),
    retryCount: 0,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  if (CONFIG.debug) {
    console.error('[ErrorTracking] Captured error:', {
      id: errorId,
      error: errorMessage,
      context,
    });
    return errorId;
  }

  errorQueue.push(queuedError);
  processQueue().catch(() => {
    /* Will retry later */
  });
  return errorId;
}

/** Capture a message (non-error event) */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context: Omit<ErrorContext, 'level'> = {}
): string | null {
  return captureError(message, { ...context, level });
}

/** Capture a fatal error (app crash) */
export function captureFatal(
  error: Error,
  context: Omit<ErrorContext, 'level'> = {}
): string | null {
  return captureError(error, { ...context, level: 'fatal' });
}
