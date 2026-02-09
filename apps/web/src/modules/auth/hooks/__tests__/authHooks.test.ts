import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuthStore = {
  isAuthenticated: false,
  user: null as Record<string, unknown> | null,
  isLoading: false,
  error: null as string | null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  clearError: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};
vi.mock('@/lib/api', () => ({ api: mockApi }));

import { useAuth, useTwoFactor, useSessions } from '../index';

// ─── Tests ───────────────────────────────────────────────────────────────────
// NOTE: The existing test at modules/auth/__tests__/hooks.test.ts covers:
//  - useAuth: state, login success/fail, logout, register success/fail
//  - useTwoFactor: isEnabled true/false
//  - useSessions: initial empty state
// This file focuses on behaviors NOT covered there.

describe('Auth Hooks — Extended Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
    mockAuthStore.error = null;
  });

  // ── useAuth extended ─────────────────────────────────────────────────────

  describe('useAuth – clearError', () => {
    it('should expose clearError from the store', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockAuthStore.clearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAuth – loading state', () => {
    it('should reflect isLoading from the store', () => {
      mockAuthStore.isLoading = true;

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useAuth – error state', () => {
    it('should reflect error from the store', () => {
      mockAuthStore.error = 'Something went wrong';

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe('Something went wrong');
    });
  });

  // ── useTwoFactor extended ────────────────────────────────────────────────

  describe('useTwoFactor – enable', () => {
    it('should call the setup endpoint and return secret + qr_code on success', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: false };
      mockApi.post.mockResolvedValueOnce({
        data: { secret: 'ABCDEF', qr_code: 'data:image/png;base64,...' },
      });

      const { result } = renderHook(() => useTwoFactor());

      let setupResult: { secret: string; qr_code: string } | null = null;
      await act(async () => {
        setupResult = await result.current.enable();
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/totp/setup');
      expect(setupResult).toEqual({ secret: 'ABCDEF', qr_code: 'data:image/png;base64,...' });
    });

    it('should return null when enable fails', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: false };
      mockApi.post.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useTwoFactor());

      let setupResult: unknown = 'initial';
      await act(async () => {
        setupResult = await result.current.enable();
      });

      expect(setupResult).toBeNull();
    });
  });

  describe('useTwoFactor – verify', () => {
    it('should call enable endpoint and update user on success', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: false };
      mockApi.post.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useTwoFactor());

      let verifyResult: boolean | undefined;
      await act(async () => {
        verifyResult = await result.current.verify('123456');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/totp/enable', { code: '123456' });
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ twoFactorEnabled: true });
      expect(verifyResult).toBe(true);
    });

    it('should return false when verify fails', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: false };
      mockApi.post.mockRejectedValueOnce(new Error('Invalid code'));

      const { result } = renderHook(() => useTwoFactor());

      let verifyResult: boolean | undefined;
      await act(async () => {
        verifyResult = await result.current.verify('000000');
      });

      expect(verifyResult).toBe(false);
    });
  });

  describe('useTwoFactor – disable', () => {
    it('should call disable endpoint and update user on success', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: true };
      mockApi.post.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useTwoFactor());

      let disableResult: boolean | undefined;
      await act(async () => {
        disableResult = await result.current.disable('654321');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/auth/totp/disable', { code: '654321' });
      expect(mockAuthStore.updateUser).toHaveBeenCalledWith({ twoFactorEnabled: false });
      expect(disableResult).toBe(true);
    });

    it('should return false when disable fails', async () => {
      mockAuthStore.user = { id: 'u1', twoFactorEnabled: true };
      mockApi.post.mockRejectedValueOnce(new Error('Bad code'));

      const { result } = renderHook(() => useTwoFactor());

      let disableResult: boolean | undefined;
      await act(async () => {
        disableResult = await result.current.disable('000000');
      });

      expect(disableResult).toBe(false);
    });
  });

  // ── useSessions extended ─────────────────────────────────────────────────

  describe('useSessions – getSessions', () => {
    it('should fetch sessions and populate state', async () => {
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/auth/sessions');
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.currentSessionId).toBe('s1');
      expect(fetched).toEqual(sessionsData.sessions);
    });

    it('should return empty array when getSessions fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useSessions());

      let fetched: unknown;
      await act(async () => {
        fetched = await result.current.getSessions();
      });

      expect(fetched).toEqual([]);
      expect(result.current.sessions).toEqual([]);
    });
  });

  describe('useSessions – revokeSession', () => {
    it('should delete session and remove from state', async () => {
      // Populate sessions first
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(2);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeSession('s2');
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/auth/sessions/s2');
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.id).toBe('s1');
    });
  });

  describe('useSessions – revokeAllOtherSessions', () => {
    it('should remove all non-current sessions', async () => {
      const sessionsData = {
        sessions: [
          { id: 's1', device: 'Chrome', ip: '1.2.3.4', lastActive: '2025-12-01', isCurrent: true },
          {
            id: 's2',
            device: 'Firefox',
            ip: '5.6.7.8',
            lastActive: '2025-11-30',
            isCurrent: false,
          },
          { id: 's3', device: 'Safari', ip: '9.8.7.6', lastActive: '2025-11-29', isCurrent: false },
        ],
        current_session_id: 's1',
      };
      mockApi.get.mockResolvedValueOnce({ data: sessionsData });
      mockApi.delete.mockResolvedValueOnce({ data: {} });

      const { result } = renderHook(() => useSessions());

      await act(async () => {
        await result.current.getSessions();
      });
      expect(result.current.sessions).toHaveLength(3);

      let revokeResult: boolean | undefined;
      await act(async () => {
        revokeResult = await result.current.revokeAllOtherSessions();
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/auth/sessions');
      expect(revokeResult).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]!.isCurrent).toBe(true);
    });
  });
});
