import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API URL should NOT include /api/v1 - individual endpoints will include the full path
// This matches the web app's API configuration for consistency
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

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
          
          const { token, refresh_token: newRefreshToken } = response.data.data || response.data;
          
          await SecureStore.setItemAsync('cgraph_auth_token', token);
          await SecureStore.setItemAsync('cgraph_refresh_token', newRefreshToken);
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          return api(originalRequest);
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

export default api;
