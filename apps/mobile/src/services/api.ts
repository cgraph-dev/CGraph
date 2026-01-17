/**
 * API Service Module
 *
 * Re-exports API utilities for consistent module resolution.
 * This module provides a stable import path for services.
 *
 * @module services/api
 */
import api, { API_URL } from '../lib/api';

/**
 * Auth-specific API wrapper for authentication operations.
 * These methods wrap the base API client with auth-specific logic.
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: { email: string; password: string }) {
    const response = await api.post('/api/v1/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    password_confirmation: string;
    username: string;
  }) {
    const response = await api.post('/api/v1/auth/register', { user: data });
    return response.data;
  },

  /**
   * Verify 2FA token
   */
  async verifyTwoFactor(data: { token: string; code: string }) {
    const response = await api.post('/api/v1/auth/2fa/verify', data);
    return response.data;
  },

  /**
   * Refresh the authentication token
   */
  async refreshToken(refreshToken: string) {
    const response = await api.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Logout the current user
   */
  async logout() {
    const response = await api.post('/api/v1/auth/logout');
    return response.data;
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  },

  /**
   * Login with wallet (Web3)
   */
  async walletLogin(data: {
    wallet_address: string;
    signature: string;
    message: string;
  }) {
    const response = await api.post('/api/v1/auth/wallet', data);
    return response.data;
  },
};

export { api, API_URL };
export default api;
