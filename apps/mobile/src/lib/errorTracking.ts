/**
 * Mobile Error Tracking Service
 *
 * Production-ready error tracking infrastructure for React Native.
 * Integrates with Sentry or sends to custom backend.
 *
 * Features:
 * - Automatic error capture with context
 * - User context enrichment
 * - Breadcrumb trail for debugging
 * - Rate limiting to prevent flooding
 * - PII stripping for privacy compliance
 * - Offline error queuing with retry
 *
 * @module lib/errorTracking
 * @version 1.0.0
 * @since v0.9.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
  /** Error severity level */
  level?: 'fatal' | 'error' | 'warning' | 'info';
  /** Tags for categorization */
  tags?: Record<string, string>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  isPremium?: boolean;
}

export interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'http' | 'ui' | 'console' | 'error' | 'user' | 'websocket';
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

interface QueuedError {
  id: string;
  error: string;
  stack?: string;
  context: ErrorContext;
  userContext: UserContext | null;
  breadcrumbs: Breadcrumb[];
  timestamp: number;
  retryCount: number;
  deviceInfo: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  maxBreadcrumbs: 30,
  maxErrorsPerMinute: 10,
  retryInterval: 60000,
  maxRetries: 3,
  errorEndpoint: '/api/v1/telemetry/errors',
  enabled: !__DEV__,
  debug: __DEV__,
  storageKey: '@cgraph/error_queue',
};

// ============================================================================
// State
// ============================================================================

let userContext: UserContext | null = null;
const breadcrumbs: Breadcrumb[] = [];
let errorQueue: QueuedError[] = [];
let errorCount = 0;
let errorCountResetTime = Date.now();
let isInitialized = false;
let apiBaseUrl = '';

// ============================================================================
// PII Stripping
// ============================================================================

const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'apikey', 'api_key',
  'authorization', 'cookie', 'session', 'credit_card',
  'ssn', 'private_key', 'privatekey',
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

function stripPii(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';

  if (typeof obj === 'string') {
    return obj.replace(EMAIL_REGEX, '[EMAIL]').replace(JWT_REGEX, '[JWT]');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => stripPii(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = stripPii(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}

// ============================================================================
// Device Info
// ============================================================================

function getDeviceInfo(): Record<string, unknown> {
  return {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    deviceType: Device.deviceType,
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    appVersion: Constants.expoConfig?.version || '0.0.0',
    buildNumber: Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode,
    isDevice: Device.isDevice,
  };
}

// ============================================================================
// Breadcrumbs
// ============================================================================

/**
 *
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  breadcrumbs.push({
    ...breadcrumb,
    timestamp: Date.now(),
     
    data: stripPii(breadcrumb.data) as Record<string, unknown> | undefined,
  });

  // Trim to max size
  while (breadcrumbs.length > CONFIG.maxBreadcrumbs) {
    breadcrumbs.shift();
  }
}

/**
 *
 */
export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

// ============================================================================
// User Context
// ============================================================================

/**
 *
 */
export function setUser(user: UserContext): void {
  userContext = {
    id: user.id,
    username: user.username,
    isPremium: user.isPremium,
    // Don't store email for privacy
  };
}

/**
 *
 */
export function clearUser(): void {
  userContext = null;
}

// ============================================================================
// Error Capture
// ============================================================================

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - errorCountResetTime > 60000) {
    errorCount = 0;
    errorCountResetTime = now;
  }
  return errorCount >= CONFIG.maxErrorsPerMinute;
}

/**
 *
 */
export function captureError(
  error: Error | string,
  context: ErrorContext = {}
): string | null {
  if (!CONFIG.enabled && !CONFIG.debug) return null;

  if (isRateLimited()) {
    if (CONFIG.debug) {
      console.warn('[ErrorTracking] Rate limited, skipping error');
    }
    return null;
  }

  errorCount++;
  const errorId = generateErrorId();

  const errorObj = error instanceof Error ? error : new Error(String(error));

  const queuedError: QueuedError = {
    id: errorId,
    error: errorObj.message,
    stack: errorObj.stack,
     
    context: stripPii(context) as ErrorContext,
    userContext,
    breadcrumbs: [...breadcrumbs],
    timestamp: Date.now(),
    retryCount: 0,
    deviceInfo: getDeviceInfo(),
  };

  // Add error as breadcrumb
  addBreadcrumb({
    category: 'error',
    message: errorObj.message,
    level: 'error',
    data: { errorId },
  });

  if (CONFIG.debug) {
    console.error('[ErrorTracking]', errorObj.message, context);
  }

  if (CONFIG.enabled) {
    errorQueue.push(queuedError);
    persistQueue();
    processQueue();
  }

  return errorId;
}

/**
 *
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' = 'info',
  context: ErrorContext = {}
): string | null {
  return captureError(message, { ...context, level });
}

/**
 *
 */
export function captureFatal(error: Error, context: ErrorContext = {}): string | null {
  return captureError(error, { ...context, level: 'fatal' });
}

// ============================================================================
// Queue Management
// ============================================================================

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(CONFIG.storageKey, JSON.stringify(errorQueue));
  } catch (e) {
    if (CONFIG.debug) {
      console.warn('[ErrorTracking] Failed to persist queue', e);
    }
  }
}

async function loadQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(CONFIG.storageKey);
    if (stored) {
      errorQueue = JSON.parse(stored);
    }
  } catch (e) {
    if (CONFIG.debug) {
      console.warn('[ErrorTracking] Failed to load queue', e);
    }
  }
}

async function processQueue(): Promise<void> {
  if (errorQueue.length === 0 || !apiBaseUrl) return;

  const errorsToSend = [...errorQueue];
  errorQueue = [];

  for (const error of errorsToSend) {
    try {
      const response = await fetch(`${apiBaseUrl}${CONFIG.errorEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: error.id,
          message: error.error,
          stack: error.stack,
          context: error.context,
          user: error.userContext,
          breadcrumbs: error.breadcrumbs,
          timestamp: error.timestamp,
          device: error.deviceInfo,
        }),
      });

      if (!response.ok && error.retryCount < CONFIG.maxRetries) {
        error.retryCount++;
        errorQueue.push(error);
      }
    } catch (e) {
      if (error.retryCount < CONFIG.maxRetries) {
        error.retryCount++;
        errorQueue.push(error);
      }
    }
  }

  await persistQueue();
}

// ============================================================================
// Initialization
// ============================================================================

/**
 *
 */
export async function initErrorTracking(baseUrl: string): Promise<void> {
  if (isInitialized) return;

  apiBaseUrl = baseUrl;
  await loadQueue();

  // Start queue processor — adaptive: 60s active, 4 min backgrounded
  // Store interval ID for cleanup; AppState-aware to reduce background work
   
  const { AppState } = require('react-native');
  let queueInterval: ReturnType<typeof setInterval> | null = null;

  const startQueueProcessor = () => {
    if (queueInterval) clearInterval(queueInterval);
    const delay = AppState.currentState === 'active' ? CONFIG.retryInterval : CONFIG.retryInterval * 4;
    queueInterval = setInterval(processQueue, delay);
  };

  startQueueProcessor();
  AppState.addEventListener('change', startQueueProcessor);

  isInitialized = true;

  if (CONFIG.debug) {
     
    console.info('[ErrorTracking] Initialized for mobile');
  }
}

// ============================================================================
// Export
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
};

export default errorTracking;
