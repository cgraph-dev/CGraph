/**
 * AuthContext — Re-export layer from Zustand stores.
 *
 * All state lives in `stores/authStore.ts` (Zustand).
 * This file re-exports the same API so existing consumers keep working.
 * New code should import directly from `@/stores` or `@/stores/authStore`.
 *
 * @deprecated Import from '@/stores' or '@/stores/authStore' instead.
 */

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
