import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API URL configuration with security checks
const getApiUrl = (): string => {
  const configuredUrl = Constants.expoConfig?.extra?.apiUrl;
  
  // Development mode allows localhost HTTP
  if (__DEV__) {
    return configuredUrl || 'http://localhost:4000';
  }
  
  // Production MUST have a configured HTTPS URL
  if (!configuredUrl) {
    throw new Error('API_URL must be configured for production builds');
  }
  
  if (!configuredUrl.startsWith('https://')) {
    throw new Error('Production API must use HTTPS');
  }
  
  return configuredUrl;
};

const API_URL = getApiUrl();

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
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
