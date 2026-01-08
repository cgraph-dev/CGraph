import axios from 'axios';
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

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => {
    // Development logging for successful responses
    if (__DEV__) {
      console.log(`[API] Response ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
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
    
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('cgraph_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          // Backend returns tokens.access_token and tokens.refresh_token
          const data = response.data.data || response.data;
          const tokens = data.tokens || data;
          const newAccessToken = tokens.access_token || tokens.token;
          const newRefreshToken = tokens.refresh_token;
          
          if (newAccessToken) {
            await SecureStore.setItemAsync('cgraph_auth_token', newAccessToken);
            if (newRefreshToken) {
              await SecureStore.setItemAsync('cgraph_refresh_token', newRefreshToken);
            }
            
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await SecureStore.deleteItemAsync('cgraph_auth_token');
        await SecureStore.deleteItemAsync('cgraph_refresh_token');
        // Navigation to login will be handled by AuthContext
      }
    }
    
    return Promise.reject(error);
  }
);

export { API_URL };
export default api;
