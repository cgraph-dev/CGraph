/**
 * Auth Hooks
 *
 * Custom React hooks for authentication.
 * Connected to authStore for actual backend integration.
 */

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/modules/auth/store';

/**
 * Hook for authentication state and actions
 */
export function useAuth() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    clearError,
  } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await storeLogin(email, password);
        return true;
      } catch {
        return false;
      }
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  const register = useCallback(
    async (data: { email: string; username: string; password: string }) => {
      try {
        await storeRegister(data.email, data.username, data.password);
        return true;
      } catch {
        return false;
      }
    },
    [storeRegister]
  );

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
  };
}

/**
 * Hook for two-factor authentication
 */
export function useTwoFactor() {
  const { user, updateUser } = useAuthStore();
  const isEnabled = user?.twoFactorEnabled ?? false;

  const enable = useCallback(async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.post('/api/v1/auth/totp/setup');

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return response.data as { secret: string; qr_code: string };
    } catch {
      return null;
    }
  }, []);

  const verify = useCallback(
    async (code: string) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post('/api/v1/auth/totp/enable', { code });
        updateUser({ twoFactorEnabled: true });
        return true;
      } catch {
        return false;
      }
    },
    [updateUser]
  );

  const disable = useCallback(
    async (code: string) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post('/api/v1/auth/totp/disable', { code });
        updateUser({ twoFactorEnabled: false });
        return true;
      } catch {
        return false;
      }
    },
    [updateUser]
  );

  return {
    isEnabled,
    enable,
    verify,
    disable,
  };
}

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

/**
 * Hook for session management
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const getSessions = useCallback(async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/api/v1/auth/sessions');

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const data = response.data as { sessions: Session[]; current_session_id: string };
      setSessions(data.sessions);
      setCurrentSessionId(data.current_session_id);
      return data.sessions;
    } catch {
      return [];
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const { api } = await import('@/lib/api');
      await api.delete(`/api/v1/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    try {
      const { api } = await import('@/lib/api');
      await api.delete('/api/v1/auth/sessions');
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    sessions,
    currentSessionId,
    getSessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}
