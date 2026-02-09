/**
 * Auth Store Unit Tests
 *
 * Comprehensive tests for the Zustand auth store.
 * Covers initial state, login, register, wallet auth, logout,
 * session refresh, checkAuth, updateUser, clearError, and error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { AxiosError, type AxiosResponse } from 'axios';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/tokenService', () => ({
  registerTokenHandlers: vi.fn(),
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
};

// ── Fixtures ───────────────────────────────────────────────────────────

const mockApiUser = {
  id: 'user-1',
  uid: '1234567890',
  user_id: 42,
  user_id_display: '#1234567890',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://cdn.test.com/avatar.png',
  wallet_address: null,
  email_verified_at: '2025-01-01T00:00:00Z',
  totp_enabled: false,
  status: 'online',
  custom_status: null,
  karma: 100,
  is_verified: true,
  is_premium: false,
  is_admin: false,
  can_change_username: true,
  username_next_change_at: null,
  inserted_at: '2024-06-01T12:00:00Z',
  level: 5,
  xp: 1200,
  coins: 50,
  streak: 3,
};

const mockTokens = {
  access_token: 'access-token-abc',
  refresh_token: 'refresh-token-xyz',
};

const getInitialState = () => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
});

// ── Helpers ────────────────────────────────────────────────────────────

// Dynamic import so mocks are registered first
async function getStore() {
  const mod = await import('../authStore.impl');
  return mod.useAuthStore;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('AuthStore', () => {
  let useAuthStore: Awaited<ReturnType<typeof getStore>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    useAuthStore = await getStore();
    useAuthStore.setState(getInitialState());
  });

  // ── Initial state ──────────────────────────────────────────────────

  describe('Initial state', () => {
    it('starts with null user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('starts unauthenticated', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('starts with no tokens', () => {
      const s = useAuthStore.getState();
      expect(s.token).toBeNull();
      expect(s.refreshToken).toBeNull();
    });

    it('starts with isLoading false', () => {
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('starts with null error', () => {
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ── login ──────────────────────────────────────────────────────────

  describe('login', () => {
    it('sets isLoading true during request', async () => {
      mockedApi.post.mockImplementation(() => new Promise(() => {})); // never resolves
      useAuthStore
        .getState()
        .login('a@b.com', 'pw')
        .catch(() => {});
      await vi.waitFor(() => expect(useAuthStore.getState().isLoading).toBe(true));
    });

    it('sets user and tokens on success', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().login('test@example.com', 'password');

      const s = useAuthStore.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(s.user?.email).toBe('test@example.com');
      expect(s.user?.username).toBe('testuser');
      expect(s.token).toBe('access-token-abc');
      expect(s.refreshToken).toBe('refresh-token-xyz');
      expect(s.isLoading).toBe(false);
    });

    it('calls the correct API endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().login('test@example.com', 'pw');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        identifier: 'test@example.com',
        password: 'pw',
      });
    });

    it('maps user fields correctly from API', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().login('test@example.com', 'pw');

      const u = useAuthStore.getState().user!;
      expect(u.id).toBe('user-1');
      expect(u.uid).toBe('1234567890');
      expect(u.userId).toBe(42);
      expect(u.karma).toBe(100);
      expect(u.level).toBe(5);
      expect(u.xp).toBe(1200);
      expect(u.twoFactorEnabled).toBe(false);
    });

    it('throws on invalid response (missing user)', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { tokens: mockTokens },
      } as AxiosResponse);

      await expect(useAuthStore.getState().login('a@b.com', 'pw')).rejects.toThrow(
        'Invalid login response'
      );
    });

    it('sets error on AxiosError', async () => {
      const err = new AxiosError('Network error');
      err.response = { data: { error: 'Invalid credentials' }, status: 401 } as AxiosResponse;
      mockedApi.post.mockRejectedValueOnce(err);

      await expect(useAuthStore.getState().login('a@b.com', 'pw')).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears previous error on new login attempt', async () => {
      useAuthStore.setState({ error: 'old error' });
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().login('a@b.com', 'pw');
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ── register ───────────────────────────────────────────────────────

  describe('register', () => {
    it('sends correct payload', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().register('a@b.com', 'newuser', 'pass123');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/register', {
        user: {
          email: 'a@b.com',
          username: 'newuser',
          password: 'pass123',
          password_confirmation: 'pass123',
        },
      });
    });

    it('sets authenticated state on success', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().register('a@b.com', 'u', 'p');

      const s = useAuthStore.getState();
      expect(s.isAuthenticated).toBe(true);
      expect(s.user).not.toBeNull();
      expect(s.isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      const err = new AxiosError();
      err.response = { data: { message: 'Username taken' }, status: 422 } as AxiosResponse;
      mockedApi.post.mockRejectedValueOnce(err);

      await expect(useAuthStore.getState().register('a@b.com', 'u', 'p')).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe('Username taken');
    });
  });

  // ── wallet auth ────────────────────────────────────────────────────

  describe('getWalletChallenge', () => {
    it('returns challenge message and nonce', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { message: 'Sign this', nonce: 'abc123' },
      } as AxiosResponse);

      const result = await useAuthStore.getState().getWalletChallenge('0xWALLET');

      expect(result).toEqual({ message: 'Sign this', nonce: 'abc123' });
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/wallet/challenge', {
        wallet_address: '0xWALLET',
      });
    });

    it('sets error on failure', async () => {
      const err = new AxiosError();
      err.response = { data: { error: 'Invalid wallet' }, status: 400 } as AxiosResponse;
      mockedApi.post.mockRejectedValueOnce(err);

      await expect(useAuthStore.getState().getWalletChallenge('0xBAD')).rejects.toThrow();
      expect(useAuthStore.getState().error).toBe('Invalid wallet');
    });
  });

  describe('loginWithWallet', () => {
    it('authenticates with wallet signature', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { user: mockApiUser, tokens: mockTokens },
      } as AxiosResponse);

      await useAuthStore.getState().loginWithWallet('0xWALLET', 'sig');

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/wallet/verify', {
        wallet_address: '0xWALLET',
        signature: 'sig',
      });
    });

    it('sets error on wallet login failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useAuthStore.getState().loginWithWallet('0x', 's')).rejects.toThrow();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // ── logout ─────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears all auth state', async () => {
      useAuthStore.setState({
        user: { id: 'x' } as any,
        token: 'tok',
        refreshToken: 'ref',
        isAuthenticated: true,
      });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useAuthStore.getState().logout();

      const s = useAuthStore.getState();
      expect(s.user).toBeNull();
      expect(s.token).toBeNull();
      expect(s.refreshToken).toBeNull();
      expect(s.isAuthenticated).toBe(false);
    });

    it('calls server logout endpoint', async () => {
      useAuthStore.setState({ token: 'tok' });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useAuthStore.getState().logout();
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/auth/logout');
    });

    it('clears state even if server call fails', async () => {
      useAuthStore.setState({ token: 'tok', isAuthenticated: true });
      mockedApi.post.mockRejectedValueOnce(new Error('offline'));

      await useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('skips server call if no token', async () => {
      useAuthStore.setState({ token: null });
      await useAuthStore.getState().logout();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  // ── refreshSession ─────────────────────────────────────────────────

  describe('refreshSession', () => {
    it('updates tokens on success', async () => {
      useAuthStore.setState({ refreshToken: 'old-refresh' });
      mockedApi.post.mockResolvedValueOnce({
        data: { tokens: { access_token: 'new-access', refresh_token: 'new-refresh' } },
      } as AxiosResponse);

      await useAuthStore.getState().refreshSession();

      expect(useAuthStore.getState().token).toBe('new-access');
      expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
    });

    it('clears auth state on refresh failure', async () => {
      useAuthStore.setState({
        refreshToken: 'old',
        isAuthenticated: true,
        user: { id: 'x' } as any,
      });
      mockedApi.post.mockRejectedValueOnce(new Error('expired'));

      await useAuthStore.getState().refreshSession();

      const s = useAuthStore.getState();
      expect(s.user).toBeNull();
      expect(s.isAuthenticated).toBe(false);
    });

    it('does nothing if no refreshToken', async () => {
      useAuthStore.setState({ refreshToken: null });
      await useAuthStore.getState().refreshSession();
      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  // ── checkAuth ──────────────────────────────────────────────────────

  describe('checkAuth', () => {
    it('fetches current user when token exists', async () => {
      useAuthStore.setState({ token: 'valid' });
      mockedApi.get.mockResolvedValueOnce({
        data: { data: mockApiUser },
      } as AxiosResponse);

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears state when token is invalid', async () => {
      useAuthStore.setState({ token: 'invalid', isAuthenticated: true });
      mockedApi.get.mockRejectedValueOnce(new Error('401'));

      await useAuthStore.getState().checkAuth();

      const s = useAuthStore.getState();
      expect(s.isAuthenticated).toBe(false);
      expect(s.user).toBeNull();
      expect(s.token).toBeNull();
    });

    it('sets isLoading false when no token', async () => {
      useAuthStore.setState({ token: null, isLoading: true });
      await useAuthStore.getState().checkAuth();
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ── updateUser / clearError ────────────────────────────────────────

  describe('updateUser', () => {
    it('merges partial user data', () => {
      useAuthStore.setState({ user: { id: 'u1', username: 'old' } as any });
      useAuthStore.getState().updateUser({ username: 'new' });
      expect(useAuthStore.getState().user?.username).toBe('new');
    });

    it('does nothing if no user', () => {
      useAuthStore.setState({ user: null });
      useAuthStore.getState().updateUser({ username: 'x' });
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('resets error to null', () => {
      useAuthStore.setState({ error: 'some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
