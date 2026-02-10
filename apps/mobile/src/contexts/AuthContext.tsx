/**
 * AuthContext — BACKWARD-COMPATIBLE SHIM
 *
 * All state has moved to `stores/authStore.ts` (Zustand).
 * This file re-exports the same API so 18 consumers keep working.
 * New code should import directly from `@/stores` or `@/stores/authStore`.
 *
 * @deprecated Import from '@/stores' or '@/stores/authStore' instead.
 */

import React from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Drop-in replacement for the old `useAuth()` context hook.
 * Returns the same shape as the original AuthContextType.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };
}

/**
 * AuthProvider — no-op wrapper for backward compatibility.
 * The store hydrates itself; no React context is needed.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

