/**
 * useAuthFacade Unit Tests
 *
 * Tests for the auth composition facade hook.
 * Validates state derivation, action delegation, and default values.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthFacade } from '../useAuthFacade';
import { useAuthStore } from '@/modules/auth/store';
import type { User } from '@/modules/auth/store';

// Mock the auth store
vi.mock('@/modules/auth/store', () => {
  const store = vi.fn();
  return { useAuthStore: store };
});

const mockUser: User = {
  id: 'user-123',
  uid: '4829173650',
  userId: 1,
  userIdDisplay: '#4829173650',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  walletAddress: null,
  emailVerifiedAt: '2026-01-01T00:00:00Z',
  twoFactorEnabled: false,
  status: 'online',
  statusMessage: null,
  karma: 100,
  isVerified: true,
  isPremium: true,
  isAdmin: false,
  canChangeUsername: true,
  usernameNextChangeAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  level: 5,
  xp: 1200,
  title: 'Pioneer',
  badges: ['early-adopter', 'contributor'],
};

const mockActions = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
  updateUser: vi.fn(),
};

function setupMockStore(overrides: Record<string, unknown> = {}) {
  const state: Record<string, unknown> = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    ...mockActions,
    ...overrides,
  };

  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state)
  );
}

describe('useAuthFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockStore();
  });

  describe('default state (unauthenticated)', () => {
    it('returns false for isAuthenticated', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns null user and derived fields', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.user).toBeNull();
      expect(result.current.userId).toBeNull();
      expect(result.current.username).toBeNull();
      expect(result.current.displayName).toBeNull();
      expect(result.current.avatarUrl).toBeNull();
    });

    it('returns false for premium/admin/verified when no user', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isPremium).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isVerified).toBe(false);
    });

    it('returns loading and error state', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      setupMockStore({
        isAuthenticated: true,
        user: mockUser,
      });
    });

    it('returns true for isAuthenticated', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('derives userId from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.userId).toBe('user-123');
    });

    it('derives username from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.username).toBe('testuser');
    });

    it('derives displayName from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.displayName).toBe('Test User');
    });

    it('derives avatarUrl from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('derives isPremium from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isPremium).toBe(true);
    });

    it('derives isVerified from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isVerified).toBe(true);
    });

    it('derives isAdmin from user object', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('loading state', () => {
    it('exposes isLoading when true', () => {
      setupMockStore({ isLoading: true });
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error state', () => {
    it('exposes error string', () => {
      setupMockStore({ error: 'Invalid credentials' });
      const { result } = renderHook(() => useAuthFacade());
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('actions', () => {
    it('login returns true on success', async () => {
      mockActions.login.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useAuthFacade());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.login('test@example.com', 'password123');
      });

      expect(success).toBe(true);
      expect(mockActions.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('login returns false on failure', async () => {
      mockActions.login.mockRejectedValueOnce(new Error('Invalid'));
      const { result } = renderHook(() => useAuthFacade());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.login('test@example.com', 'wrong');
      });

      expect(success).toBe(false);
    });

    it('register returns true on success', async () => {
      mockActions.register.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useAuthFacade());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.register('test@example.com', 'testuser', 'password123');
      });

      expect(success).toBe(true);
      expect(mockActions.register).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'password123'
      );
    });

    it('register returns false on failure', async () => {
      mockActions.register.mockRejectedValueOnce(new Error('Username taken'));
      const { result } = renderHook(() => useAuthFacade());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.register('test@example.com', 'taken', 'password123');
      });

      expect(success).toBe(false);
    });

    it('logout delegates to store', async () => {
      mockActions.logout.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useAuthFacade());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockActions.logout).toHaveBeenCalled();
    });

    it('clearError delegates to store', () => {
      const { result } = renderHook(() => useAuthFacade());
      result.current.clearError();
      expect(mockActions.clearError).toHaveBeenCalled();
    });

    it('updateUser delegates to store', () => {
      const { result } = renderHook(() => useAuthFacade());
      const updates = { displayName: 'New Name' };
      result.current.updateUser(updates);
      expect(mockActions.updateUser).toHaveBeenCalledWith(updates);
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      setupMockStore({ isAuthenticated: true, user: mockUser });
      const { result } = renderHook(() => useAuthFacade());
      const keys = Object.keys(result.current);

      expect(keys).toContain('isAuthenticated');
      expect(keys).toContain('user');
      expect(keys).toContain('isLoading');
      expect(keys).toContain('error');
      expect(keys).toContain('userId');
      expect(keys).toContain('username');
      expect(keys).toContain('displayName');
      expect(keys).toContain('avatarUrl');
      expect(keys).toContain('isPremium');
      expect(keys).toContain('isAdmin');
      expect(keys).toContain('isVerified');
      expect(keys).toContain('login');
      expect(keys).toContain('register');
      expect(keys).toContain('logout');
      expect(keys).toContain('clearError');
      expect(keys).toContain('updateUser');
    });

    it('all action properties are functions', () => {
      const { result } = renderHook(() => useAuthFacade());
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.updateUser).toBe('function');
    });
  });
});
