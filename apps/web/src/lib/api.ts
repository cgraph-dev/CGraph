import { AxiosResponse } from 'axios';
import { createHttpClient, extractApiError, withZod } from '@cgraph/utils';
import { ZodSchema } from 'zod';
import {
  getAccessToken,
  getRefreshToken,
  setTokens as setTokensInStore,
  triggerLogout,
} from './tokenService';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API');

// Token payload interface for refresh response parsing
interface TokenPayload {
  access_token?: string;
  token?: string;
  refresh_token?: string;
}

/**
 * API URL Configuration
 *
 * PRODUCTION (Vercel): Uses relative paths with rewrites
 * - VITE_API_URL is empty or '/api' - rewrites handle routing
 *
 * DEVELOPMENT: Uses full backend URL
 * - Vite proxy handles /api -> localhost:4000
 *
 * The API endpoints should NOT include /api prefix as it's part of the base URL
 */
// Use nullish coalescing (??) to handle empty string correctly
// Empty string means "use relative paths" for Vercel rewrites
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Lazy import socket to avoid circular dependency
async function reconnectSocket(): Promise<void> {
  try {
    const { socketManager } = await import('./socket');
    if (socketManager.isConnected()) {
      await socketManager.reconnectWithNewToken();
    }
  } catch (err) {
    logger.warn('Socket reconnect failed:', err);
  }
}

/**
 * HTTP Client Instance
 *
 * CIRCULAR DEPENDENCY FIX:
 * - Previously imported useAuthStore directly, causing initialization race condition
 * - Now uses tokenService.ts which provides lazy-bound token accessors
 * - authStore registers its handlers with tokenService on initialization
 * - This breaks the circular dependency: api.ts -> tokenService.ts (no store import)
 *
 * PRODUCTION BUILD:
 * - The "Cannot access 'Ct' before initialization" error was caused by the circular import
 * - 'Ct' is the minified name of useAuthStore in the production bundle
 * - This refactor ensures api.ts can initialize before authStore without errors
 */
export const api = createHttpClient({
  baseURL: API_URL,
  timeoutMs: 30000,
  withCredentials: true,
  getAccessToken: () => getAccessToken(),
  getRefreshToken: () => getRefreshToken(),
  setTokens: async ({ accessToken, refreshToken }) => {
    setTokensInStore({ accessToken, refreshToken: refreshToken ?? null });
    reconnectSocket();
  },
  onLogout: async () => {
    await triggerLogout();
    window.location.href = '/login';
  },
  refresh: {
    endpoint: '/api/v1/auth/refresh',
    buildBody: (rt) => ({ refresh_token: rt }),
    withCredentials: true,
    parseTokens: (data: unknown) => {
      // Type-safe parsing of refresh token response
      const response = data as
        | { data?: { tokens?: TokenPayload }; tokens?: TokenPayload }
        | TokenPayload;
      const payload = 'data' in response && response.data ? response.data : response;
      const tokens =
        'tokens' in payload && payload.tokens ? payload.tokens : (payload as TokenPayload);
      return {
        accessToken: tokens.access_token || tokens.token || '',
        refreshToken: tokens.refresh_token,
      };
    },
  },
  retry: {
    attempts: 3,
    backoffMs: 400,
    maxBackoffMs: 5000,
  },
  idempotency: {
    enabled: true,
  },
});

export function parseWith<T>(
  promise: Promise<AxiosResponse<unknown>>,
  schema: ZodSchema<T>
): Promise<T> {
  return withZod(promise, schema);
}

export function getErrorMessage(error: unknown): string {
  const info = extractApiError(error);
  return info.message;
}

export { API_URL };
