/**
 * Auth Store Slice
 * 
 * Manages authentication state across platforms.
 */

import type { AuthState, SliceCreator } from '../types';

export interface AuthActions {
  setToken: (token: string, refreshToken: string, expiresAt: number) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  refreshSession: (token: string, expiresAt: number) => void;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  token: null,
  refreshToken: null,
  expiresAt: null,
};

export const createAuthSlice: SliceCreator<AuthState, AuthActions> = (set) => ({
  ...initialAuthState,

  setToken: (token, refreshToken, expiresAt) =>
    set({
      isAuthenticated: true,
      isLoading: false,
      token,
      refreshToken,
      expiresAt,
    }),

  clearAuth: () =>
    set({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
      expiresAt: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  refreshSession: (token, expiresAt) =>
    set({
      token,
      expiresAt,
    }),
});

export const authSelectors = {
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  token: (state: AuthState) => state.token,
  isLoading: (state: AuthState) => state.isLoading,
  isExpired: (state: AuthState) => 
    state.expiresAt !== null && Date.now() > state.expiresAt,
};
