import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Token refresh mutex to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Lazy import socket to avoid circular dependency
let socketManagerPromise: Promise<{ default: { reconnectWithNewToken: () => Promise<void> } }> | null = null;
async function getSocketManager() {
  if (!socketManagerPromise) {
    socketManagerPromise = import('./socket');
  }
  return (await socketManagerPromise).default;
}

// Token refresh mutex to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh - queued requests wait for new token
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all queued requests with new token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Reject all queued requests on refresh failure
 */
function onRefreshFailed(): void {
  refreshSubscribers = [];
}

// Create axios instance with credentials (cookies) enabled
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // Enable sending cookies with cross-origin requests
  // This allows HTTP-only cookie authentication (XSS-safe)
  withCredentials: true,
});

// Request interceptor - add auth token as fallback
// Primary auth is via HTTP-only cookies, but we keep token in header
// for backwards compatibility and WebSocket connections
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh with mutex
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      // Start refresh - set mutex
      isRefreshing = true;

      try {
        // Refresh endpoint will use HTTP-only cookie if available
        // Fall back to sending refresh token in body
        const response = await axios.post(
          `${API_URL}/api/v1/auth/refresh`, 
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Handle both response formats: { token, refresh_token } and { data: { tokens: { access_token, refresh_token } } }
        const data = response.data.data || response.data;
        const tokens = data.tokens || data;
        const newToken = tokens.access_token || tokens.token;
        const newRefreshToken = tokens.refresh_token;
        
        if (!newToken) {
          throw new Error('No access token in refresh response');
        }
        
        useAuthStore.setState({
          token: newToken,
          refreshToken: newRefreshToken,
        });

        // Release mutex and notify subscribers
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Reconnect WebSocket with new token (async, non-blocking)
        getSocketManager()
          .then(sm => sm.reconnectWithNewToken())
          .catch(err => console.warn('[API] Socket reconnect failed:', err));

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Release mutex and reject subscribers
        isRefreshing = false;
        onRefreshFailed();

        // Refresh failed - logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper types for API responses
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  error: string;
  errors?: Record<string, string[]>;
}

// Helper function to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.error) return data.error;
    if (data?.errors) {
      const firstError = Object.values(data.errors)[0];
      if (firstError?.[0]) return firstError[0];
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
