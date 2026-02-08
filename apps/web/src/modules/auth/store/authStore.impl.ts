/**
 * Authentication Store
 *
 * Manages user authentication state, session tokens, and user profile.
 * Uses Zustand with persistence middleware for session management.
 *
 * @module stores/authStore
 * @version 1.0.0
 * @since v0.1.0
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { registerTokenHandlers } from '@/lib/tokenService';
import { authLogger } from '@/lib/logger';
import { AxiosError } from 'axios';

// Types
export type { ApiErrorResponse, User, WalletChallenge, AuthState } from './authStore.types';

import type { User, WalletChallenge, AuthState } from './authStore.types';

// Utilities (extracted to reduce file size)
export { mapUserFromApi } from './authStore.utils';
import { getApiErrorMessage, mapUserFromApi, createSecureStorage } from './authStore.utils';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false, // Start with false - checkAuth will handle loading state
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, false, 'login/start');
          try {
            authLogger.info('[Auth] Attempting login...', { identifier: email });
            const response = await api.post('/api/v1/auth/login', {
              identifier: email, // Backend accepts email or username
              password,
            });

            // Debug logging for auth troubleshooting
            authLogger.info('[Auth] Login response received', {
              status: response.status,
              hasUser: !!response.data?.user,
              hasTokens: !!response.data?.tokens,
              cookiesPresent: document.cookie.includes('cgraph_'),
            });

            const { user, tokens } = response.data;

            if (!user || !tokens) {
              authLogger.error('[Auth] Invalid response structure', { data: response.data });
              throw new Error('Invalid login response: missing user or tokens');
            }

            set(
              {
                user: mapUserFromApi(user),
                token: tokens.access_token,
                refreshToken: tokens.refresh_token,
                isAuthenticated: true,
                isLoading: false,
              },
              false,
              'login/success'
            );

            authLogger.info('[Auth] Login successful', {
              userId: user.id,
              username: user.username,
            });
          } catch (error: unknown) {
            // Enhanced error logging for debugging
            if (error instanceof AxiosError) {
              authLogger.error('[Auth] Login failed (AxiosError)', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                code: error.code,
                // Check for CORS issues
                isCorsError: error.code === 'ERR_NETWORK' && !error.response,
              });
            } else {
              authLogger.error('[Auth] Login failed (Unknown error)', { error });
            }

            set(
              {
                error: getApiErrorMessage(error, 'Login failed'),
                isLoading: false,
              },
              false,
              'login/error'
            );
            throw error;
          }
        },

        getWalletChallenge: async (walletAddress: string): Promise<WalletChallenge> => {
          try {
            const response = await api.post('/api/v1/auth/wallet/challenge', {
              wallet_address: walletAddress,
            });
            return {
              message: response.data.message,
              nonce: response.data.nonce,
            };
          } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error, 'Failed to get wallet challenge');
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        loginWithWallet: async (walletAddress: string, signature: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post('/api/v1/auth/wallet/verify', {
              wallet_address: walletAddress,
              signature,
            });
            const { user, tokens } = response.data;
            set({
              user: mapUserFromApi(user),
              token: tokens.access_token,
              refreshToken: tokens.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: unknown) {
            set({
              error: getApiErrorMessage(error, 'Wallet login failed'),
              isLoading: false,
            });
            throw error;
          }
        },

        register: async (email: string, username: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post('/api/v1/auth/register', {
              user: {
                email,
                username,
                password,
                password_confirmation: password, // Backend requires confirmation
              },
            });
            const { user, tokens } = response.data;
            set({
              user: mapUserFromApi(user),
              token: tokens.access_token,
              refreshToken: tokens.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: unknown) {
            set({
              error: getApiErrorMessage(error, 'Registration failed'),
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          // Attempt server-side logout to invalidate tokens
          const { token } = get();
          if (token) {
            try {
              await api.post('/api/v1/auth/logout');
            } catch {
              // Continue with client-side cleanup even if server call fails
              // This handles offline scenarios gracefully
            }
          }

          // Clear all client-side auth state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        },

        refreshSession: async () => {
          const { refreshToken } = get();
          if (!refreshToken) {
            set({ isLoading: false });
            return;
          }

          try {
            const response = await api.post('/api/v1/auth/refresh', {
              refresh_token: refreshToken,
            });
            // Handle both wrapped and unwrapped token responses
            const data = response.data;
            const tokens = data.tokens || data;
            const accessToken = tokens.access_token;
            const newRefreshToken = tokens.refresh_token;

            if (accessToken) {
              set({
                token: accessToken,
                refreshToken: newRefreshToken || refreshToken,
              });
            }
          } catch {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
        },

        updateUser: (data: Partial<User>) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...data } });
          }
        },

        clearError: () => set({ error: null }),

        checkAuth: async () => {
          const { token } = get();
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          try {
            const response = await api.get('/api/v1/me');
            // Backend returns { data: { id, email, ... } }
            const userData = response.data.data || response.data.user || response.data;
            set({
              user: mapUserFromApi(userData),
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Clear invalid/stale auth on any error
            authLogger.debug('checkAuth failed - clearing auth:', error);
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'cgraph-auth',
        storage: createJSONStorage(() => createSecureStorage()),
        partialize: (state) => ({
          token: state.token,
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        // Critical: Handle rehydration to fix isLoading state
        onRehydrateStorage: () => {
          authLogger.debug('onRehydrateStorage called');
          return (state, error) => {
            authLogger.debug('Rehydration callback - state:', !!state, 'error:', error);
            if (error) {
              authLogger.error('Auth store rehydration failed:', error);
              // On error, reset to safe state
              useAuthStore.setState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                refreshToken: null,
              });
            } else if (state) {
              // Rehydration successful - mark loading as complete
              // Don't block on token validation - let the app render
              authLogger.debug('Rehydration complete - hasToken:', !!state.token);
              useAuthStore.setState({
                isLoading: false, // Never block - checkAuth runs in background
              });
            } else {
              // No state to rehydrate
              authLogger.debug('No state to rehydrate');
              useAuthStore.setState({ isLoading: false });
            }
          };
        },
      }
    ),
    {
      name: 'AuthStore',
      enabled: import.meta.env.DEV,
    }
  )
);

/**
 * Register token handlers with tokenService
 *
 * CIRCULAR DEPENDENCY FIX:
 * - api.ts needs access to tokens but can't import authStore (creates circular dep)
 * - tokenService.ts provides a decoupled interface
 * - authStore registers its handlers here after initialization
 * - api.ts calls tokenService functions which delegate to these handlers
 *
 * This ensures:
 * 1. api.ts can initialize before authStore loads
 * 2. No "Cannot access before initialization" errors in production builds
 * 3. Token access works correctly once store is ready
 */
registerTokenHandlers({
  getAccessToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: ({ accessToken, refreshToken }) => {
    useAuthStore.setState({
      token: accessToken,
      refreshToken: refreshToken ?? useAuthStore.getState().refreshToken,
    });
  },
  onLogout: () => useAuthStore.getState().logout(),
});

// Safety timeout: ensure isLoading is set to false within 3 seconds of module load
// This catches any edge cases where rehydration might not complete
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const state = useAuthStore.getState();
    if (state.isLoading) {
      authLogger.warn('Safety timeout: forcing isLoading to false');
      useAuthStore.setState({ isLoading: false });
    }
  }, 3000);
}
