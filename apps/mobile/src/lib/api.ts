import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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
      console.log('[API] Using configured URL:', configuredUrl);
      return configuredUrl;
    }
    
    // Android emulator uses 10.0.2.2 to reach host machine's localhost
    // iOS simulator can use localhost directly
    if (Platform.OS === 'android') {
      console.log('[API] Android detected, using 10.0.2.2:4000');
      return 'http://10.0.2.2:4000';
    }
    console.log('[API] iOS detected, using localhost:4000');
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

// Log API configuration at startup in development
if (__DEV__) {
  console.log('[API] Base URL configured:', API_URL);
  console.log('[API] Platform:', Platform.OS);
}

// =============================================================================
// Token Refresh Mutex (Prevents Race Conditions)
// =============================================================================
// When multiple requests fail with 401 simultaneously, only ONE refresh should
// occur. Other requests queue up and wait for the new token.

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshRejectSubscribers: ((error: Error) => void)[] = [];

/**
 * Subscribe to token refresh - queued requests wait for new token
 */
function subscribeTokenRefresh(
  onSuccess: (token: string) => void,
  onError: (error: Error) => void
): void {
  refreshSubscribers.push(onSuccess);
  refreshRejectSubscribers.push(onError);
}

/**
 * Notify all queued requests with new token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
  refreshRejectSubscribers = [];
}

/**
 * Reject all queued requests on refresh failure
 */
function onRefreshFailed(error: Error): void {
  refreshRejectSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
  refreshRejectSubscribers = [];
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('cgraph_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Development logging for network debugging
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh + mutex
api.interceptors.response.use(
  (response) => {
    // Development logging for successful responses
    if (__DEV__) {
      console.log(`[API] Response ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Development logging for network errors
    if (__DEV__) {
      if (error.response) {
        console.log(`[API] Error ${error.response.status} from ${error.config?.url}:`, 
          JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log(`[API] Network error - no response received for ${error.config?.url}`);
        console.log('[API] Request details:', error.message);
      } else {
        console.log('[API] Request setup error:', error.message);
      }
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Only handle 401 errors for token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            (err: Error) => {
              reject(err);
            }
          );
        });
      }
      
      // Start refresh - set mutex
      isRefreshing = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('cgraph_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        // Backend returns tokens.access_token and tokens.refresh_token
        const data = response.data.data || response.data;
        const tokens = data.tokens || data;
        const newAccessToken = tokens.access_token || tokens.token;
        const newRefreshToken = tokens.refresh_token;
        
        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }
        
        // Store new tokens
        await SecureStore.setItemAsync('cgraph_auth_token', newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('cgraph_refresh_token', newRefreshToken);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Release mutex and notify subscribers
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Release mutex and reject subscribers
        isRefreshing = false;
        onRefreshFailed(refreshError instanceof Error ? refreshError : new Error('Refresh failed'));
        
        // Clear tokens - auth context will handle navigation
        await SecureStore.deleteItemAsync('cgraph_auth_token');
        await SecureStore.deleteItemAsync('cgraph_refresh_token');
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
