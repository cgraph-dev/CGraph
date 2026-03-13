/**
 * Auth Services (Mobile)
 */

import { API_URL } from '@/services/api';
import * as SecureStore from 'expo-secure-store';

export const authApi = {
  login: () => `${API_URL}/api/v1/auth/login`,
  logout: () => `${API_URL}/api/v1/auth/logout`,
  register: () => `${API_URL}/api/v1/auth/register`,
  refreshToken: () => `${API_URL}/api/v1/auth/refresh`,
  forgotPassword: () => `${API_URL}/api/v1/auth/forgot-password`,
  resetPassword: () => `${API_URL}/api/v1/auth/reset-password`,
  verifyEmail: (token: string) => `${API_URL}/api/v1/auth/verify-email/${token}`,
  enable2FA: () => `${API_URL}/api/v1/auth/2fa/enable`,
  verify2FA: () => `${API_URL}/api/v1/auth/2fa/verify`,
  disable2FA: () => `${API_URL}/api/v1/auth/2fa/disable`,
  getMe: () => `${API_URL}/api/v1/auth/me`,
  updateProfile: () => `${API_URL}/api/v1/auth/profile`,
};

// Secure token storage for mobile
export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync('cgraph_access_token');
  },

  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync('cgraph_access_token', token);
  },

  removeAccessToken: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('cgraph_access_token');
  },

  getRefreshToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync('cgraph_refresh_token');
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync('cgraph_refresh_token', token);
  },

  removeRefreshToken: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('cgraph_refresh_token');
  },

  clearAll: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('cgraph_access_token');
    await SecureStore.deleteItemAsync('cgraph_refresh_token');
  },
};
