// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Friend Store Unit Tests
 *
 * Comprehensive tests for the Zustand friend store.
 * Covers initial state, fetch friends, pending/sent requests,
 * send/accept/decline, remove, block/unblock, error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import type { AxiosResponse } from 'axios';

// ── API mock ───────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@cgraph/utils', () => ({
  createIdempotencyKey: () => 'idem-key-123',
}));

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: (_data: unknown, key: string) => {
    if (Array.isArray(_data)) return _data;
    if (_data && typeof _data === 'object' && key in (_data as Record<string, unknown>))
      return (_data as Record<string, unknown>)[key];
    return [];
  },
  extractErrorMessage: (_err: unknown, fallback: string) => {
    if (_err instanceof Error) return _err.message;
    return fallback;
  },
}));

import { api } from '@/lib/api';
import { useFriendStore } from '../friendStore.impl';
import type { Friend, FriendRequest } from '../friend-types';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ── Fixtures ───────────────────────────────────────────────────────────

const mockFriend: Friend = {
  id: 'friend-1',
  username: 'bob',
  displayName: 'Bob',
  avatarUrl: null,
  status: 'online',
  statusMessage: null,
  friendshipId: 'fs-1',
  createdAt: '2025-01-01T00:00:00Z',
};

const mockFriend2: Friend = {
  ...mockFriend,
  id: 'friend-2',
  username: 'carol',
  displayName: 'Carol',
  friendshipId: 'fs-2',
};

const mockRequest: FriendRequest = {
  id: 'req-1',
  user: { id: 'user-3', username: 'dave', displayName: 'Dave', avatarUrl: null },
  createdAt: '2025-06-01T00:00:00Z',
  type: 'incoming',
};

const getInitialState = () => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,
});

// ── Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  useFriendStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('FriendStore', () => {
  // ── Initial state ────────────────────────────────────────────────

  describe('Initial state', () => {
    it('starts with empty friends', () => {
      expect(useFriendStore.getState().friends).toEqual([]);
    });

    it('starts with empty pendingRequests', () => {
      expect(useFriendStore.getState().pendingRequests).toEqual([]);
    });

    it('starts with empty sentRequests', () => {
      expect(useFriendStore.getState().sentRequests).toEqual([]);
    });

    it('starts not loading', () => {
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('starts with null error', () => {
      expect(useFriendStore.getState().error).toBeNull();
    });
  });

  // ── fetchFriends ─────────────────────────────────────────────────

  describe('fetchFriends', () => {
    it('sets isLoading during fetch', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {}));
      useFriendStore.getState().fetchFriends();
      await vi.waitFor(() => expect(useFriendStore.getState().isLoading).toBe(true));
    });

    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
      await useFriendStore.getState().fetchFriends();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends');
    });

    it('sets isLoading false on success', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
      await useFriendStore.getState().fetchFriends();
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
      await useFriendStore.getState().fetchFriends();
      expect(useFriendStore.getState().error).toBe('Network error');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });
  });

  // ── fetchPendingRequests ─────────────────────────────────────────

  describe('fetchPendingRequests', () => {
    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
      await useFriendStore.getState().fetchPendingRequests();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/requests');
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await useFriendStore.getState().fetchPendingRequests();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── fetchSentRequests ────────────────────────────────────────────

  describe('fetchSentRequests', () => {
    it('calls correct endpoint', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);
      await useFriendStore.getState().fetchSentRequests();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/sent');
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await useFriendStore.getState().fetchSentRequests();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── sendRequest ──────────────────────────────────────────────────

  describe('sendRequest', () => {
    it('sends with username payload for plain text', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      // mock fetchSentRequests call that happens inside sendRequest
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().sendRequest('alice');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { username: 'alice' },
        expect.objectContaining({ headers: { 'Idempotency-Key': 'idem-key-123' } })
      );
    });

    it('sends with user_id payload for UUID', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().sendRequest('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        expect.any(Object)
      );
    });

    it('sends with email payload for email format', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().sendRequest('alice@example.com');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { email: 'alice@example.com' },
        expect.any(Object)
      );
    });

    it('sends with uid payload for numeric UID', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().sendRequest('#1234567890');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/friends',
        { uid: '1234567890' },
        expect.any(Object)
      );
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Already friends'));

      await expect(useFriendStore.getState().sendRequest('bob')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('Already friends');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('refreshes sent requests on success', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().sendRequest('alice');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/friends/sent');
    });
  });

  // ── acceptRequest ────────────────────────────────────────────────

  describe('acceptRequest', () => {
    it('calls accept endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      // fetchFriends + fetchPendingRequests
      mockedApi.get.mockResolvedValue({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().acceptRequest('req-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/accept');
    });

    it('refreshes friends and pending lists', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValue({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().acceptRequest('req-1');

      const getCalls = mockedApi.get.mock.calls.map((c) => c[0]);
      expect(getCalls).toContain('/api/v1/friends');
      expect(getCalls).toContain('/api/v1/friends/requests');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('expired'));

      await expect(useFriendStore.getState().acceptRequest('req-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('expired');
    });
  });

  // ── declineRequest ───────────────────────────────────────────────

  describe('declineRequest', () => {
    it('calls decline endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as AxiosResponse);

      await useFriendStore.getState().declineRequest('req-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/req-1/decline');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().declineRequest('req-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── removeFriend ─────────────────────────────────────────────────

  describe('removeFriend', () => {
    it('removes friend from list optimistically', async () => {
      useFriendStore.setState({ friends: [mockFriend, mockFriend2] });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useFriendStore.getState().removeFriend('fs-1');

      const s = useFriendStore.getState();
      expect(s.friends).toHaveLength(1);
      expect(s.friends[0].id).toBe('friend-2');
    });

    it('calls correct endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);
      await useFriendStore.getState().removeFriend('fs-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/friends/fs-1');
    });

    it('sets error on failure', async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().removeFriend('fs-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── blockUser ────────────────────────────────────────────────────

  describe('blockUser', () => {
    it('removes user from friends and pending lists', async () => {
      useFriendStore.setState({
        friends: [mockFriend],
        pendingRequests: [{ ...mockRequest, user: { ...mockRequest.user, id: 'friend-1' } }],
      });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useFriendStore.getState().blockUser('friend-1');

      const s = useFriendStore.getState();
      expect(s.friends).toHaveLength(0);
      expect(s.pendingRequests).toHaveLength(0);
    });

    it('calls block endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      await useFriendStore.getState().blockUser('user-1');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/friends/user-1/block');
    });

    it('sets error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().blockUser('user-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── unblockUser ──────────────────────────────────────────────────

  describe('unblockUser', () => {
    it('calls unblock endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);
      await useFriendStore.getState().unblockUser('user-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/friends/user-1/block');
    });

    it('sets isLoading false on success', async () => {
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);
      await useFriendStore.getState().unblockUser('user-1');
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.delete.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().unblockUser('user-1')).rejects.toThrow();
      expect(useFriendStore.getState().error).toBe('fail');
    });
  });

  // ── clearError ───────────────────────────────────────────────────

  describe('clearError', () => {
    it('resets error to null', () => {
      useFriendStore.setState({ error: 'some error' });
      useFriendStore.getState().clearError();
      expect(useFriendStore.getState().error).toBeNull();
    });
  });
});
