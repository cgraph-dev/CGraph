import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth, useTwoFactor, useSessions } from '../hooks';
import { useAuthStore } from '@/modules/auth/store';

// Mock the auth store (must match the import path used in hooks/index.ts)
vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Auth Hooks', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    twoFactorEnabled: false,
  };

  const mockAuthStore = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    clearError: vi.fn(),
    updateUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any);
  });

  describe('useAuth', () => {
    it('should return authentication state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return authenticated state when user exists', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        isAuthenticated: true,
        user: mockUser,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should call login and return true on success', async () => {
      mockAuthStore.login.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | undefined;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthStore.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(loginResult).toBe(true);
    });

    it('should call login and return false on failure', async () => {
      mockAuthStore.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      let loginResult: boolean | undefined;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult).toBe(false);
    });

    it('should call logout', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthStore.logout).toHaveBeenCalled();
    });

    it('should call register and return true on success', async () => {
      mockAuthStore.register.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth());

      let registerResult: boolean | undefined;
      await act(async () => {
        registerResult = await result.current.register({
          email: 'new@example.com',
          username: 'newuser',
          password: 'password123',
        });
      });

      expect(mockAuthStore.register).toHaveBeenCalledWith(
        'new@example.com',
        'newuser',
        'password123'
      );
      expect(registerResult).toBe(true);
    });

    it('should call register and return false on failure', async () => {
      mockAuthStore.register.mockRejectedValueOnce(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth());

      let registerResult: boolean | undefined;
      await act(async () => {
        registerResult = await result.current.register({
          email: 'existing@example.com',
          username: 'existinguser',
          password: 'password123',
        });
      });

      expect(registerResult).toBe(false);
    });
  });

  describe('useTwoFactor', () => {
    it('should return 2FA disabled state by default', () => {
      const { result } = renderHook(() => useTwoFactor());

      expect(result.current.isEnabled).toBe(false);
    });

    it('should return 2FA enabled state when user has it enabled', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        user: { ...mockUser, twoFactorEnabled: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const { result } = renderHook(() => useTwoFactor());

      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('useSessions', () => {
    it('should initialize with empty sessions', () => {
      const { result } = renderHook(() => useSessions());

      expect(result.current.sessions).toEqual([]);
      expect(result.current.currentSessionId).toBeNull();
      expect(typeof result.current.getSessions).toBe('function');
      expect(typeof result.current.revokeSession).toBe('function');
      expect(typeof result.current.revokeAllOtherSessions).toBe('function');
    });
  });
});
