import { createHttpClient, extractApiError, withZod } from '@cgraph/utils';
import { ZodSchema } from 'zod';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Lazy import socket to avoid circular dependency
async function reconnectSocket(): Promise<void> {
  try {
    const { socketManager } = await import('./socket');
    if (socketManager.isConnected()) {
      await socketManager.reconnectWithNewToken();
    }
  } catch (err) {
    console.warn('[API] Socket reconnect failed:', err);
  }
}

export const api = createHttpClient({
  baseURL: API_URL,
  timeoutMs: 30000,
  withCredentials: true,
  getAccessToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: async ({ accessToken, refreshToken }) => {
    useAuthStore.setState({
      token: accessToken,
      refreshToken: refreshToken ?? useAuthStore.getState().refreshToken,
    });
    reconnectSocket();
  },
  onLogout: () => {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  },
  refresh: {
    endpoint: '/api/v1/auth/refresh',
    buildBody: (rt) => ({ refresh_token: rt }),
    withCredentials: true,
    parseTokens: (data: unknown) => {
      const payload = (data as any)?.data || data;
      const tokens = (payload as any)?.tokens || payload || {};
      return {
        accessToken: tokens.access_token || tokens.token,
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

export function parseWith<T>(promise: Promise<any>, schema: ZodSchema<T>): Promise<T> {
  return withZod(promise, schema);
}

export function getErrorMessage(error: unknown): string {
  const info = extractApiError(error);
  return info.message;
}

export { API_URL };
