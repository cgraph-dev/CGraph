/**
 * friendStore Unit Tests
 *
 * Tests for Zustand friend store state management.
 * These tests focus on synchronous state operations.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { useFriendStore, type Friend, type FriendRequest } from '../friendStore';

// Mock friend data
const mockFriend: Friend = {
  id: 'user-123',
  username: 'testfriend',
  displayName: 'Test Friend',
  avatarUrl: 'https://example.com/avatar.png',
  avatarBorderId: null,
  avatar_border_id: null,
  status: 'online',
  statusMessage: null,
  friendshipId: 'friend-456',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockFriendRequest: FriendRequest = {
  id: 'request-789',
  user: {
    id: 'user-999',
    username: 'requester',
    displayName: 'Request User',
    avatarUrl: null,
    avatarBorderId: null,
    avatar_border_id: null,
  },
  createdAt: '2026-01-01T00:00:00Z',
  type: 'incoming',
};

// Reset store state after each test
afterEach(() => {
  useFriendStore.setState({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
  });
});

describe('friendStore', () => {
  describe('initial state', () => {
    it('should have initial empty friends list', () => {
      expect(useFriendStore.getState().friends).toHaveLength(0);
    });

    it('should have initial empty pending requests', () => {
      expect(useFriendStore.getState().pendingRequests).toHaveLength(0);
    });

    it('should have initial empty sent requests', () => {
      expect(useFriendStore.getState().sentRequests).toHaveLength(0);
    });

    it('should not be loading initially', () => {
      expect(useFriendStore.getState().isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      expect(useFriendStore.getState().error).toBeNull();
    });
  });

  describe('friends state', () => {
    it('should store friend in list', () => {
      useFriendStore.setState({
        friends: [mockFriend],
      });

      expect(useFriendStore.getState().friends).toHaveLength(1);
      expect(useFriendStore.getState().friends[0]?.username).toBe('testfriend');
    });

    it('should handle multiple friends', () => {
      const friend2: Friend = {
        ...mockFriend,
        id: 'user-456',
        username: 'friend2',
        friendshipId: 'friend-789',
      };

      useFriendStore.setState({
        friends: [mockFriend, friend2],
      });

      expect(useFriendStore.getState().friends).toHaveLength(2);
    });

    it('should store friend with all properties', () => {
      useFriendStore.setState({
        friends: [mockFriend],
      });

      const friend = useFriendStore.getState().friends[0];
      expect(friend?.id).toBe('user-123');
      expect(friend?.username).toBe('testfriend');
      expect(friend?.displayName).toBe('Test Friend');
      expect(friend?.avatarUrl).toBe('https://example.com/avatar.png');
      expect(friend?.status).toBe('online');
      expect(friend?.friendshipId).toBe('friend-456');
    });
  });

  describe('pending requests state', () => {
    it('should track incoming friend requests', () => {
      useFriendStore.setState({
        pendingRequests: [mockFriendRequest],
      });

      expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
      expect(useFriendStore.getState().pendingRequests[0]?.type).toBe('incoming');
    });

    it('should store request user info', () => {
      useFriendStore.setState({
        pendingRequests: [mockFriendRequest],
      });

      const request = useFriendStore.getState().pendingRequests[0];
      expect(request?.user.id).toBe('user-999');
      expect(request?.user.username).toBe('requester');
      expect(request?.user.displayName).toBe('Request User');
    });

    it('should handle multiple pending requests', () => {
      const request2: FriendRequest = {
        ...mockFriendRequest,
        id: 'request-790',
        user: {
          ...mockFriendRequest.user,
          id: 'user-998',
          username: 'requester2',
        },
      };

      useFriendStore.setState({
        pendingRequests: [mockFriendRequest, request2],
      });

      expect(useFriendStore.getState().pendingRequests).toHaveLength(2);
    });
  });

  describe('sent requests state', () => {
    it('should track outgoing friend requests', () => {
      const outgoingRequest: FriendRequest = {
        ...mockFriendRequest,
        id: 'request-out-1',
        type: 'outgoing',
      };

      useFriendStore.setState({
        sentRequests: [outgoingRequest],
      });

      expect(useFriendStore.getState().sentRequests).toHaveLength(1);
      expect(useFriendStore.getState().sentRequests[0]?.type).toBe('outgoing');
    });
  });

  describe('loading state', () => {
    it('should track loading state', () => {
      useFriendStore.setState({ isLoading: true });

      expect(useFriendStore.getState().isLoading).toBe(true);
    });

    it('should reset loading state', () => {
      useFriendStore.setState({ isLoading: true });
      useFriendStore.setState({ isLoading: false });

      expect(useFriendStore.getState().isLoading).toBe(false);
    });
  });

  describe('error state', () => {
    it('should track error state', () => {
      useFriendStore.setState({ error: 'Failed to load friends' });

      expect(useFriendStore.getState().error).toBe('Failed to load friends');
    });

    it('should clear error', () => {
      useFriendStore.setState({ error: 'Some error' });

      useFriendStore.getState().clearError();

      expect(useFriendStore.getState().error).toBeNull();
    });

    it('should allow different error messages', () => {
      useFriendStore.setState({ error: 'Network error' });
      expect(useFriendStore.getState().error).toBe('Network error');

      useFriendStore.setState({ error: 'User not found' });
      expect(useFriendStore.getState().error).toBe('User not found');
    });
  });

  describe('friend status', () => {
    it('should store online friend', () => {
      const onlineFriend: Friend = {
        ...mockFriend,
        status: 'online',
      };

      useFriendStore.setState({ friends: [onlineFriend] });

      expect(useFriendStore.getState().friends[0]?.status).toBe('online');
    });

    it('should store offline friend', () => {
      const offlineFriend: Friend = {
        ...mockFriend,
        status: 'offline',
      };

      useFriendStore.setState({ friends: [offlineFriend] });

      expect(useFriendStore.getState().friends[0]?.status).toBe('offline');
    });

    it('should store idle friend', () => {
      const idleFriend: Friend = {
        ...mockFriend,
        status: 'idle',
      };

      useFriendStore.setState({ friends: [idleFriend] });

      expect(useFriendStore.getState().friends[0]?.status).toBe('idle');
    });

    it('should store dnd friend', () => {
      const dndFriend: Friend = {
        ...mockFriend,
        status: 'dnd',
      };

      useFriendStore.setState({ friends: [dndFriend] });

      expect(useFriendStore.getState().friends[0]?.status).toBe('dnd');
    });
  });

  describe('state updates', () => {
    it('should update friends list without affecting requests', () => {
      useFriendStore.setState({
        friends: [mockFriend],
        pendingRequests: [mockFriendRequest],
      });

      useFriendStore.setState({
        friends: [],
      });

      expect(useFriendStore.getState().friends).toHaveLength(0);
      expect(useFriendStore.getState().pendingRequests).toHaveLength(1);
    });

    it('should update error without affecting friends', () => {
      useFriendStore.setState({
        friends: [mockFriend],
        error: null,
      });

      useFriendStore.setState({
        error: 'Some error',
      });

      expect(useFriendStore.getState().friends).toHaveLength(1);
      expect(useFriendStore.getState().error).toBe('Some error');
    });
  });
});
