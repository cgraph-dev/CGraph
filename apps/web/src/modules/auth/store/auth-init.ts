/**
 * Auth Store Initialization
 *
 * Token handler registration and safety timeout for the auth store.
 * Separated from the main store to reduce file size.
 *
 * @module modules/auth/store/auth-init
 */

import { registerTokenHandlers } from '@/lib/tokenService';
import { authLogger } from '@/lib/logger';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { AuthState } from './authStore.types';

/**
 * Register token handlers with tokenService and set up safety timeout.
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
export function initializeAuthStore(useAuthStore: UseBoundStore<StoreApi<AuthState>>): void {
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
}
