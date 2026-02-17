/**
 * Mobile Friend Store
 *
 * Real Zustand store for friend management.
 * Leverages the existing API client for friend CRUD operations.
 * Real-time presence updates are received via store mutations
 * called from the socket layer (e.g., updateFriendStatus, addRequest).
 *
 * @module stores/friendStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import api from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  friendId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  customStatus: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  receiver: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

function normalizeFriend(raw: Record<string, unknown>): Friend {
  const user = (raw.user || raw.friend || {}) as Record<string, unknown>;
  return {
    id: (raw.id || '') as string,
    friendId: (raw.friend_id || raw.friendId || user.id || '') as string,
    userId: (raw.user_id || raw.userId || user.id || '') as string,
    username: (user.username || raw.username || '') as string,
    displayName: (user.display_name || user.displayName || raw.display_name || null) as
      | string
      | null,
    avatarUrl: (user.avatar_url || user.avatarUrl || raw.avatar_url || null) as string | null,
    status: (user.status || raw.status || 'offline') as Friend['status'],
    customStatus: (user.custom_status || user.customStatus || null) as string | null,
    lastSeenAt: (user.last_seen_at || user.lastSeenAt || null) as string | null,
    createdAt: (raw.created_at || raw.createdAt || raw.inserted_at || '') as string,
  };
}

function normalizeRequest(raw: Record<string, unknown>): FriendRequest {
  const sender = (raw.sender || {}) as Record<string, unknown>;
  const receiver = (raw.receiver || {}) as Record<string, unknown>;
  return {
    id: (raw.id || '') as string,
    senderId: (raw.sender_id || raw.senderId || sender.id || '') as string,
    receiverId: (raw.receiver_id || raw.receiverId || receiver.id || '') as string,
    status: (raw.status || 'pending') as FriendRequest['status'],
    sender: {
      id: (sender.id || '') as string,
      username: (sender.username || '') as string,
      displayName: (sender.display_name || sender.displayName || null) as string | null,
      avatarUrl: (sender.avatar_url || sender.avatarUrl || null) as string | null,
    },
    receiver: {
      id: (receiver.id || '') as string,
      username: (receiver.username || '') as string,
      displayName: (receiver.display_name || receiver.displayName || null) as string | null,
      avatarUrl: (receiver.avatar_url || receiver.avatarUrl || null) as string | null,
    },
    createdAt: (raw.created_at || raw.createdAt || raw.inserted_at || '') as string,
  };
}

// ── Store Interface ────────────────────────────────────────────────────

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendRequest: (identifier: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (friendId: string) => Promise<void>;
  unblockUser: (friendId: string) => Promise<void>;

  // Socket mutations
  updateFriendStatus: (userId: string, status: string) => void;
  addRequest: (request: FriendRequest) => void;
}

// ── Store ──────────────────────────────────────────────────────────────

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/v1/friends');
      const raw = response.data?.friends || response.data?.data || response.data || [];
      const friends = (Array.isArray(raw) ? raw : []).map((f: Record<string, unknown>) =>
        normalizeFriend(f)
      );

      set({ friends, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to load friends' });
    }
  },

  fetchRequests: async () => {
    try {
      const response = await api.get('/api/v1/friends/requests');
      const raw = response.data?.requests || response.data?.data || response.data || [];
      const requests = (Array.isArray(raw) ? raw : []).map((r: Record<string, unknown>) =>
        normalizeRequest(r)
      );
      set({ pendingRequests: requests });
    } catch {
      // silently fail
    }
  },

  fetchSentRequests: async () => {
    try {
      const response = await api.get('/api/v1/friends/sent');
      const raw = response.data?.requests || response.data?.data || response.data || [];
      const requests = (Array.isArray(raw) ? raw : []).map((r: Record<string, unknown>) =>
        normalizeRequest(r)
      );
      set({ sentRequests: requests });
    } catch {
      // silently fail
    }
  },

  sendRequest: async (identifier: string) => {
    set({ error: null });
    try {
      // Identifier can be username, email, or user ID
      const body: Record<string, string> = {};
      if (identifier.includes('@')) {
        body.email = identifier;
      } else if (
        identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ) {
        body.user_id = identifier;
      } else {
        body.username = identifier;
      }
      await api.post('/api/v1/friends', body);
      // Refresh sent requests
      get().fetchSentRequests();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send friend request';
      set({ error: message });
      throw new Error(message);
    }
  },

  acceptRequest: async (requestId: string) => {
    try {
      await api.post(`/api/v1/friends/${requestId}/accept`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
      // Refresh friends list to include new friend
      get().fetchFriends();
    } catch {
      // silently fail
    }
  },

  declineRequest: async (requestId: string) => {
    try {
      await api.post(`/api/v1/friends/${requestId}/decline`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
      }));
    } catch {
      // silently fail
    }
  },

  removeFriend: async (friendId: string) => {
    try {
      await api.delete(`/api/v1/friends/${friendId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId && f.friendId !== friendId),
      }));
    } catch {
      // silently fail
    }
  },

  blockUser: async (friendId: string) => {
    try {
      await api.post(`/api/v1/friends/${friendId}/block`);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId && f.friendId !== friendId),
      }));
    } catch {
      // silently fail
    }
  },

  unblockUser: async (friendId: string) => {
    try {
      await api.delete(`/api/v1/friends/${friendId}/block`);
    } catch {
      // silently fail
    }
  },

  // Socket mutations
  updateFriendStatus: (userId: string, status: string) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.friendId === userId || f.userId === userId
          ? { ...f, status: status as Friend['status'] }
          : f
      ),
    }));
  },

  addRequest: (request: FriendRequest) => {
    set((state) => {
      if (state.pendingRequests.some((r) => r.id === request.id)) return state;
      return { pendingRequests: [request, ...state.pendingRequests] };
    });
  },
}));

// ── Selector hooks ───────────────────────────────────────────────────

export const useFriends = () => useFriendStore((s) => s.friends);
export const usePendingRequests = () => useFriendStore((s) => s.pendingRequests);
export const useFriendCount = () => useFriendStore((s) => s.friends.length);

export default useFriendStore;
