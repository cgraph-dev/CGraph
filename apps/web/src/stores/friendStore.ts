import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, extractErrorMessage } from '@/lib/apiUtils';

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  friendshipId: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  type: 'incoming' | 'outgoing';
}

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  sendRequest: (usernameOrId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useFriendStore = create<FriendState>()((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/v1/friends');
      set({
        friends: ensureArray<Friend>(response.data, 'friends'),
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to fetch friends'),
        isLoading: false,
      });
    }
  },

  fetchPendingRequests: async () => {
    try {
      const response = await api.get('/api/v1/friends/pending');
      set({
        pendingRequests: ensureArray<FriendRequest>(response.data, 'requests'),
      });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to fetch pending requests'),
      });
    }
  },

  fetchSentRequests: async () => {
    try {
      // Using the same endpoint as pending, filter by type on frontend
      // or if backend separates them, this would be a different endpoint
      const response = await api.get('/api/v1/friends/pending');
      const allRequests = ensureArray<FriendRequest>(response.data, 'requests');
      set({
        pendingRequests: allRequests.filter((r) => r.type === 'incoming'),
        sentRequests: allRequests.filter((r) => r.type === 'outgoing'),
      });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to fetch sent requests'),
      });
    }
  },

  sendRequest: async (usernameOrId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/v1/friends', {
        user_id: usernameOrId,
      });
      // Refresh the lists
      await get().fetchSentRequests();
      set({ isLoading: false });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to send friend request'),
        isLoading: false,
      });
      throw error;
    }
  },

  acceptRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/v1/friends/${requestId}/accept`);
      // Refresh both lists
      await Promise.all([
        get().fetchFriends(),
        get().fetchPendingRequests(),
      ]);
      set({ isLoading: false });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to accept friend request'),
        isLoading: false,
      });
      throw error;
    }
  },

  declineRequest: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/v1/friends/${requestId}/decline`);
      // Refresh pending list
      await get().fetchPendingRequests();
      set({ isLoading: false });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to decline friend request'),
        isLoading: false,
      });
      throw error;
    }
  },

  removeFriend: async (friendId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/v1/friends/${friendId}`);
      // Update friends list optimistically
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId),
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to remove friend'),
        isLoading: false,
      });
      throw error;
    }
  },

  blockUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/v1/friends/${userId}/block`);
      // Remove from friends list if present
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== userId),
        pendingRequests: state.pendingRequests.filter((r) => r.user.id !== userId),
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to block user'),
        isLoading: false,
      });
      throw error;
    }
  },

  unblockUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/v1/friends/${userId}/block`);
      set({ isLoading: false });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to unblock user'),
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
