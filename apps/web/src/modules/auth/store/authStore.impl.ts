/**
 * Authentication Store
 *
 * Manages user authentication state, session tokens, and user profile.
 * Uses Zustand with persistence middleware for session management.
 *
 * This file is the orchestrator — action implementations live in auth-actions.ts,
 * and initialization (token handlers, safety timeout) lives in auth-init.ts.
 *
 * @module stores/authStore
 * @version 1.1.0
 * @since v0.1.0
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { authLogger } from '@/lib/logger';

// Types
export type { ApiErrorResponse, User, WalletChallenge, AuthState } from './authStore.types';

import type { AuthState } from './authStore.types';

// Utilities (extracted to reduce file size)
export { mapUserFromApi } from './authStore.utils';
import { createSecureStorage } from './authStore.utils';

// Create storage once at module scope with defensive fallback.
// If sessionStorage is unavailable (private browsing, security policy, storage full)
// we fall back to a no-op in-memory store so the app still boots.
let safeStorage: StateStorage;
try {
  safeStorage = createSecureStorage();
  // Smoke-test: verify sessionStorage is actually accessible
  const testKey = '__cgraph_storage_test__';
  sessionStorage.setItem(testKey, '1');
  sessionStorage.removeItem(testKey);
} catch (err) {
  authLogger.warn('sessionStorage unavailable, using in-memory fallback:', err);
  const memoryStore = new Map<string, string>();
  safeStorage = {
    getItem: (name: string) => memoryStore.get(name) ?? null,
    setItem: (name: string, value: string) => {
      memoryStore.set(name, value);
    },
    removeItem: (name: string) => {
      memoryStore.delete(name);
    },
  };
}

// Actions (extracted to reduce file size)
import {
  createLoginAction,
  createGetWalletChallengeAction,
  createLoginWithWalletAction,
  createRegisterAction,
  createLogoutAction,
  createRefreshSessionAction,
  createUpdateUserAction,
  createCheckAuthAction,
} from './auth-actions';

// Initialization (token handlers + safety timeout)
import { initializeAuthStore } from './auth-init';

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

        login: createLoginAction(set, get),
        getWalletChallenge: createGetWalletChallengeAction(set, get),
        loginWithWallet: createLoginWithWalletAction(set, get),
        register: createRegisterAction(set, get),
        logout: createLogoutAction(set, get),
        refreshSession: createRefreshSessionAction(set, get),
        updateUser: createUpdateUserAction(set, get),
        clearError: () => set({ error: null }),
        checkAuth: createCheckAuthAction(set, get),
      }),
      {
        name: 'cgraph-auth-v2',
        storage: createJSONStorage(() => safeStorage),
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

// Register token handlers and set up safety timeout
initializeAuthStore(useAuthStore);
