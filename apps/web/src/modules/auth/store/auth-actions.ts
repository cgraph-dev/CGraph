/**
 * Auth Store Actions
 *
 * Action implementations for authentication state management.
 * These are extracted from the main store to reduce file size.
 *
 * @module modules/auth/store/auth-actions
 */

import { api } from '@/lib/api';
import { authLogger } from '@/lib/logger';
import { AxiosError } from 'axios';

import type { User, WalletChallenge, AuthState } from './authStore.types';
import { getApiErrorMessage, mapUserFromApi } from './authStore.utils';

type Set = (
  partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>),
  replace?: false,
  action?: string
) => void;
type Get = () => AuthState;

/**
 * unknown for the auth module.
 */
/**
 * Creates a new login action.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createLoginAction(set: Set, _get: Get) {
  return async (email: string, password: string) => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new get wallet challenge action.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createGetWalletChallengeAction(set: Set, _get: Get) {
  return async (walletAddress: string): Promise<WalletChallenge> => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new login with wallet action.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createLoginWithWalletAction(set: Set, _get: Get) {
  return async (walletAddress: string, signature: string) => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new register action.
 *
 * @param set - The set.
 * @param _get - The _get.
 * @returns The newly created instance.
 */
export function createRegisterAction(set: Set, _get: Get) {
  return async (email: string, username: string, password: string) => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new logout action.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createLogoutAction(set: Set, get: Get) {
  return async () => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new refresh session action.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createRefreshSessionAction(set: Set, get: Get) {
  return async () => {
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
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new update user action.
 *
 * @param _set - The _set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createUpdateUserAction(_set: Set, get: Get) {
  return (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      // We need to use the store's set directly — handled via closure
      _set({ user: { ...user, ...data } });
    }
  };
}

/**
 * unknown for the auth module.
 */
/**
 * Creates a new check auth action.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createCheckAuthAction(set: Set, get: Get) {
  return async () => {
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
  };
}
