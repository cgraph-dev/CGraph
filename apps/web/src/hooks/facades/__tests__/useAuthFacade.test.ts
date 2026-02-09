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

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

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

function setupStore(overrides: Record<string, unknown> = {}) {
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
    setupStore();
  });

  // ── Default / unauthenticated state ──────────────────────────────

  it('returns false for isAuthenticated by default', () => {
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns null user and all derived fields when unauthenticated', () => {
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

  it('returns loading false and error null by default', () => {
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── Authenticated state derivation ───────────────────────────────

  it('derives all user fields when authenticated', () => {
    setupStore({ isAuthenticated: true, user: mockUser });
    const { result } = renderHook(() => useAuthFacade());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('user-123');
    expect(result.current.username).toBe('testuser');
    expect(result.current.displayName).toBe('Test User');
    expect(result.current.avatarUrl).toBe('https://example.com/avatar.png');
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isVerified).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('derives isAdmin as true for admin user', () => {
    setupStore({ isAuthenticated: true, user: { ...mockUser, isAdmin: true } });
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.isAdmin).toBe(true);
  });

  it('derives null for undefined optional user fields', () => {
    const partial = { ...mockUser, displayName: undefined, avatarUrl: undefined };
    setupStore({ isAuthenticated: true, user: partial });
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.displayName).toBeNull();
    expect(result.current.avatarUrl).toBeNull();
  });

  // ── Loading / error ──────────────────────────────────────────────

  it('exposes isLoading true', () => {
    setupStore({ isLoading: true });
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes error string', () => {
    setupStore({ error: 'Invalid credentials' });
    const { result } = renderHook(() => useAuthFacade());
    expect(result.current.error).toBe('Invalid credentials');
  });

  // ── Action delegation ────────────────────────────────────────────

  it('login delegates to store and returns true on success', async () => {
    mockActions.login.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuthFacade());

    let success = false;
    await act(async () => {
      success = await result.current.login('a@b.com', 'pw');
    });
    expect(success).toBe(true);
    expect(mockActions.login).toHaveBeenCalledWith('a@b.com', 'pw');
  });

  it('login catches rejection and returns false', async () => {
    mockActions.login.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useAuthFacade());

    let success = true;
    await act(async () => {
      success = await result.current.login('a@b.com', 'bad');
    });
    expect(success).toBe(false);
  });

  it('register delegates to store and returns true on success', async () => {
    mockActions.register.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuthFacade());

    let success = false;
    await act(async () => {
      success = await result.current.register('a@b.com', 'user', 'pw');
    });
    expect(success).toBe(true);
    expect(mockActions.register).toHaveBeenCalledWith('a@b.com', 'user', 'pw');
  });

  it('register catches rejection and returns false', async () => {
    mockActions.register.mockRejectedValueOnce(new Error('taken'));
    const { result } = renderHook(() => useAuthFacade());

    let success = true;
    await act(async () => {
      success = await result.current.register('a@b.com', 'taken', 'pw');
    });
    expect(success).toBe(false);
  });

  it('logout delegates to store', async () => {
    mockActions.logout.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuthFacade());

    await act(async () => {
      await result.current.logout();
    });
    expect(mockActions.logout).toHaveBeenCalledOnce();
  });

  it('clearError delegates to store', () => {
    const { result } = renderHook(() => useAuthFacade());
    result.current.clearError();
    expect(mockActions.clearError).toHaveBeenCalledOnce();
  });

  it('updateUser delegates with partial update payload', () => {
    const { result } = renderHook(() => useAuthFacade());
    const updates = { displayName: 'New', avatarUrl: 'https://new.png' };
    result.current.updateUser(updates);
    expect(mockActions.updateUser).toHaveBeenCalledWith(updates);
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns exactly 16 keys matching AuthFacade interface', () => {
    setupStore({ isAuthenticated: true, user: mockUser });
    const { result } = renderHook(() => useAuthFacade());
    const keys = Object.keys(result.current);

    const expected = [
      'isAuthenticated',
      'user',
      'isLoading',
      'error',
      'userId',
      'username',
      'displayName',
      'avatarUrl',
      'isPremium',
      'isAdmin',
      'isVerified',
      'login',
      'register',
      'logout',
      'clearError',
      'updateUser',
    ];
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
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
