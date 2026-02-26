/**
 * Tests for friendStore
 * @module stores/__tests__/friendStore
 */

import type { Friend, FriendRequest, useFriendStore } from '../friendStore';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

// ── Helpers ────────────────────────────────────────────────────────────

function resetStore() {
  useFriendStore.setState({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
  });
}

function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    id: 'f1',
    friendId: 'u2',
    userId: 'u2',
    username: 'bob',
    displayName: 'Bob',
    avatarUrl: '/bob.jpg',
    status: 'online',
    customStatus: null,
    lastSeenAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeRequest(overrides: Partial<FriendRequest> = {}): FriendRequest {
  return {
    id: 'r1',
    senderId: 'u1',
    receiverId: 'u2',
    status: 'pending',
    sender: { id: 'u1', username: 'alice', displayName: 'Alice', avatarUrl: null },
    receiver: { id: 'u2', username: 'bob', displayName: 'Bob', avatarUrl: null },
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('friendStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has empty friends and requests', () => {
      const state = useFriendStore.getState();
      expect(state.friends).toEqual([]);
      expect(state.pendingRequests).toEqual([]);
      expect(state.sentRequests).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ── fetchFriends ───────────────────────────────────────────────────

  describe('fetchFriends', () => {
    it('fetches and normalizes friends', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          friends: [
            {
              id: 'f1',
              friend_id: 'u2',
              user_id: 'u2',
              user: {
                id: 'u2',
                username: 'bob',
                display_name: 'Bob',
                avatar_url: '/bob.jpg',
                status: 'online',
                custom_status: 'Coding',
                last_seen_at: '2024-01-01T12:00:00Z',
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      await useFriendStore.getState().fetchFriends();

      const state = useFriendStore.getState();
      expect(state.friends).toHaveLength(1);
      expect(state.friends[0].username).toBe('bob');
      expect(state.friends[0].displayName).toBe('Bob');
      expect(state.friends[0].avatarUrl).toBe('/bob.jpg');
      expect(state.friends[0].status).toBe('online');
      expect(state.friends[0].customStatus).toBe('Coding');
      expect(state.isLoading).toBe(false);
    });

    it('handles API error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('fail'));

      await useFriendStore.getState().fetchFriends();

      expect(useFriendStore.getState().isLoading).toBe(false);
      expect(useFriendStore.getState().error).toBe('Failed to load friends');
    });

    it('normalizes camelCase data', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'f1',
              friendId: 'u2',
              userId: 'u2',
              username: 'bob',
              display_name: 'Bob',
              avatar_url: '/bob.jpg',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      await useFriendStore.getState().fetchFriends();
      expect(useFriendStore.getState().friends[0].friendId).toBe('u2');
    });
  });

  // ── fetchRequests ──────────────────────────────────────────────────

  describe('fetchRequests', () => {
    it('fetches pending requests', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          requests: [
            {
              id: 'r1',
              sender_id: 'u1',
              receiver_id: 'u2',
              status: 'pending',
              sender: { id: 'u1', username: 'alice' },
              receiver: { id: 'u2', username: 'bob' },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      });

      await useFriendStore.getState().fetchRequests();

      expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
      expect(useFriendStore.getState().pendingRequests[0].sender.username).toBe('alice');
    });

    it('handles error silently', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('fail'));
      await expect(useFriendStore.getState().fetchRequests()).resolves.toBeUndefined();
    });
  });

  // ── fetchSentRequests ──────────────────────────────────────────────

  describe('fetchSentRequests', () => {
    it('fetches sent requests', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          requests: [
            {
              id: 'r1',
              sender: { id: 'u1', username: 'me' },
              receiver: { id: 'u2', username: 'them' },
              created_at: '',
            },
          ],
        },
      });

      await useFriendStore.getState().fetchSentRequests();

      expect(useFriendStore.getState().sentRequests).toHaveLength(1);
    });
  });

  // ── sendRequest ────────────────────────────────────────────────────

  describe('sendRequest', () => {
    it('sends by username', async () => {
      mockApi.post.mockResolvedValueOnce({});
      // Mock fetchSentRequests called internally
      mockApi.get.mockResolvedValueOnce({ data: { requests: [] } });

      await useFriendStore.getState().sendRequest('bob');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends', { username: 'bob' });
    });

    it('sends by email', async () => {
      mockApi.post.mockResolvedValueOnce({});
      mockApi.get.mockResolvedValueOnce({ data: { requests: [] } });

      await useFriendStore.getState().sendRequest('bob@example.com');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends', { email: 'bob@example.com' });
    });

    it('sends by UUID', async () => {
      mockApi.post.mockResolvedValueOnce({});
      mockApi.get.mockResolvedValueOnce({ data: { requests: [] } });

      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      await useFriendStore.getState().sendRequest(uuid);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends', { user_id: uuid });
    });

    it('throws on API error with message', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: { data: { message: 'User not found' } },
      });

      await expect(useFriendStore.getState().sendRequest('nobody')).rejects.toThrow('User not found');
      expect(useFriendStore.getState().error).toBe('User not found');
    });

    it('uses fallback error message', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network'));

      await expect(useFriendStore.getState().sendRequest('bob')).rejects.toThrow(
        'Failed to send friend request'
      );
    });
  });

  // ── acceptRequest ──────────────────────────────────────────────────

  describe('acceptRequest', () => {
    it('accepts a request and removes from pending', async () => {
      useFriendStore.setState({
        pendingRequests: [makeRequest({ id: 'r1' }), makeRequest({ id: 'r2' })],
      });
      mockApi.post.mockResolvedValueOnce({});
      // fetchFriends called internally
      mockApi.get.mockResolvedValueOnce({ data: { friends: [] } });

      await useFriendStore.getState().acceptRequest('r1');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/r1/accept');
      expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
      expect(useFriendStore.getState().pendingRequests[0].id).toBe('r2');
    });
  });

  // ── declineRequest ─────────────────────────────────────────────────

  describe('declineRequest', () => {
    it('declines a request and removes from pending', async () => {
      useFriendStore.setState({
        pendingRequests: [makeRequest({ id: 'r1' })],
      });
      mockApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().declineRequest('r1');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/r1/decline');
      expect(useFriendStore.getState().pendingRequests).toHaveLength(0);
    });
  });

  // ── removeFriend ───────────────────────────────────────────────────

  describe('removeFriend', () => {
    it('removes friend by id', async () => {
      useFriendStore.setState({
        friends: [makeFriend({ id: 'f1', friendId: 'u2' }), makeFriend({ id: 'f2', friendId: 'u3' })],
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useFriendStore.getState().removeFriend('f1');

      expect(useFriendStore.getState().friends).toHaveLength(1);
      expect(useFriendStore.getState().friends[0].id).toBe('f2');
    });

    it('removes friend by friendId', async () => {
      useFriendStore.setState({
        friends: [makeFriend({ id: 'f1', friendId: 'u2' })],
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useFriendStore.getState().removeFriend('u2');

      expect(useFriendStore.getState().friends).toHaveLength(0);
    });
  });

  // ── blockUser / unblockUser ────────────────────────────────────────

  describe('blockUser', () => {
    it('blocks user and removes from friends', async () => {
      useFriendStore.setState({
        friends: [makeFriend({ id: 'f1', friendId: 'u2' })],
      });
      mockApi.post.mockResolvedValueOnce({});

      await useFriendStore.getState().blockUser('f1');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/friends/f1/block');
      expect(useFriendStore.getState().friends).toHaveLength(0);
    });
  });

  describe('unblockUser', () => {
    it('unblocks user', async () => {
      mockApi.delete.mockResolvedValueOnce({});

      await useFriendStore.getState().unblockUser('f1');

      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/friends/f1/block');
    });
  });

  // ── Socket mutations ──────────────────────────────────────────────

  describe('updateFriendStatus', () => {
    it('updates status by friendId', () => {
      useFriendStore.setState({
        friends: [makeFriend({ id: 'f1', friendId: 'u2', status: 'online' })],
      });

      useFriendStore.getState().updateFriendStatus('u2', 'idle');

      expect(useFriendStore.getState().friends[0].status).toBe('idle');
    });

    it('updates status by userId', () => {
      useFriendStore.setState({
        friends: [makeFriend({ id: 'f1', userId: 'u2', friendId: 'u3', status: 'offline' })],
      });

      useFriendStore.getState().updateFriendStatus('u2', 'dnd');

      expect(useFriendStore.getState().friends[0].status).toBe('dnd');
    });

    it('does not change unrelated friends', () => {
      useFriendStore.setState({
        friends: [
          makeFriend({ id: 'f1', friendId: 'u2', userId: 'u2', status: 'online' }),
          makeFriend({ id: 'f2', friendId: 'u3', userId: 'u3', status: 'offline' }),
        ],
      });

      useFriendStore.getState().updateFriendStatus('u2', 'idle');

      expect(useFriendStore.getState().friends[1].status).toBe('offline');
    });
  });

  describe('addRequest', () => {
    it('adds a request to front', () => {
      useFriendStore.setState({
        pendingRequests: [makeRequest({ id: 'r1' })],
      });

      useFriendStore.getState().addRequest(makeRequest({ id: 'r2' }));

      expect(useFriendStore.getState().pendingRequests).toHaveLength(2);
      expect(useFriendStore.getState().pendingRequests[0].id).toBe('r2');
    });

    it('deduplicates by id', () => {
      useFriendStore.setState({
        pendingRequests: [makeRequest({ id: 'r1' })],
      });

      useFriendStore.getState().addRequest(makeRequest({ id: 'r1' }));

      expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
    });
  });
});
