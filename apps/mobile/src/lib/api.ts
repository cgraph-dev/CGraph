/**
 * HTTP API client configuration with environment-aware base URL resolution and auth token management.
 * @module lib/api
 */
import { createHttpClient } from '@cgraph/utils';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API URL Configuration
 *
 * Resolves the backend API URL based on environment:
 * - Development: Uses configured URL or localhost with proper IP handling
 * - Production: Requires HTTPS configuration
 *
 * @returns The API base URL
 */
const getApiUrl = (): string => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl;

  // Development mode - allow localhost and LAN connections
  if (__DEV__) {
    if (configuredUrl) {
      console.warn('[API] Using configured URL:', configuredUrl);
      return configuredUrl;
    }

    // Android emulator uses 10.0.2.2 to reach host machine's localhost
    // iOS simulator can use localhost directly
    if (Platform.OS === 'android') {
      console.warn('[API] Android detected, using 10.0.2.2:4000');
      return 'http://10.0.2.2:4000';
    }
    console.warn('[API] iOS detected, using localhost:4000');
    return 'http://localhost:4000';
  }

  // Production MUST have a configured HTTPS URL
  if (!configuredUrl) {
    throw new Error('API_URL must be configured for production builds via app.config.js');
  }

  if (!configuredUrl.startsWith('https://')) {
    throw new Error('Production API must use HTTPS for security');
  }

  return configuredUrl;
};

const API_URL = getApiUrl();

if (__DEV__) {
  console.warn('[API] Base URL configured:', API_URL);
  console.warn('[API] Platform:', Platform.OS);
}

const api = createHttpClient({
  baseURL: API_URL,
  timeoutMs: 30000,
  getAccessToken: () => SecureStore.getItemAsync('cgraph_auth_token'),
  getRefreshToken: () => SecureStore.getItemAsync('cgraph_refresh_token'),
  setTokens: async ({ accessToken, refreshToken }) => {
    await SecureStore.setItemAsync('cgraph_auth_token', accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync('cgraph_refresh_token', refreshToken);
    }
  },
  onLogout: async () => {
    await SecureStore.deleteItemAsync('cgraph_auth_token');
    await SecureStore.deleteItemAsync('cgraph_refresh_token');
    // Sync Zustand store so RootNavigator shows auth screens
    const { useAuthStore } = require('@/stores');
    useAuthStore.getState().reset();
  },
  refresh: {
    endpoint: '/api/v1/auth/refresh',
    buildBody: (rt) => ({ refresh_token: rt }),
    parseTokens: (data: unknown) => {
       
      const payload = (data as Record<string, unknown>)?.data || data;
       
      const tokens = ((payload as Record<string, unknown>)?.tokens || payload || {}) as Record<
        string,
        unknown
      >;
      return {
         
        accessToken: ((tokens.access_token || tokens.token) as string | undefined) ?? '',
         
        refreshToken: tokens.refresh_token as string | undefined,
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

export { API_URL };
export default api;
