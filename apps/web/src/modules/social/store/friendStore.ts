/**
 * Friend Store
 *
 * Manages friend list, friend requests, and user blocking functionality.
 * Provides real-time presence updates and friend status tracking.
 *
 * ## Features
 * - Friend list with online/offline status
 * - Incoming and outgoing friend requests
 * - User blocking and unblocking
 * - Real-time status updates via Phoenix Channels
 *
 * ## Usage
 *
 * ```tsx
 * import { useFriendStore } from '@/stores/friendStore';
 *
 * function FriendsList() {
 *   const { friends, fetchFriends } = useFriendStore();
 *
 *   useEffect(() => {
 *     fetchFriends();
 *   }, []);
 *
 *   return (
 *     <div>
 *       {friends.map((friend) => (
 *         <FriendItem key={friend.id} friend={friend} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## State
 * - `friends` - List of user's friends
 * - `pendingRequests` - Incoming friend requests
 * - `sentRequests` - Outgoing friend requests
 * - `isLoading` - Loading state
 * - `error` - Last error message
 *
 * ## Actions
 * - `fetchFriends()` - Load friend list
 * - `sendFriendRequest(userId)` - Send friend request
 * - `acceptRequest(requestId)` - Accept incoming request
 * - `rejectRequest(requestId)` - Reject incoming request
 * - `removeFriend(friendId)` - Remove friend
 *
 * @module stores/friendStore
 * @version 0.9.9
 * @since v0.1.0
 */

import { create } from 'zustand';
import { createIdempotencyKey } from '@cgraph/utils';
import { api } from '@/lib/api';
import { ensureArray, extractErrorMessage } from '@/lib/apiUtils';

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
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
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
  createdAt: string;
  type: 'incoming' | 'outgoing';
}

// Helper to normalize API response to our FriendRequest format
function normalizeRequest(
  data: Record<string, unknown>,
  type: 'incoming' | 'outgoing'
): FriendRequest {
  // Backend returns 'from' for incoming and 'to' for outgoing requests
  const userData = (type === 'incoming' ? data.from : data.to) as
    | Record<string, unknown>
    | undefined;

  return {
    id: data.id as string,
    user: userData
      ? {
          id: userData.id as string,
          username: (userData.username as string) || 'Unknown',
          displayName:
            (userData.display_name as string | null) ||
            (userData.displayName as string | null) ||
            null,
          avatarUrl:
            (userData.avatar_url as string | null) || (userData.avatarUrl as string | null) || null,
          avatarBorderId:
            (userData.avatar_border_id as string | null) ||
            (userData.avatarBorderId as string | null) ||
            null,
          avatar_border_id: (userData.avatar_border_id as string | null) || null,
        }
      : {
          id: 'unknown',
          username: 'Unknown User',
          displayName: null,
          avatarUrl: null,
        },
    createdAt: (data.sent_at as string) || (data.created_at as string) || new Date().toISOString(),
    type,
  };
}

// Helper to normalize friend data from API
function normalizeFriend(data: Record<string, unknown>): Friend {
  const userData = data.user as Record<string, unknown> | undefined;

  return {
    id: (userData?.id as string) || (data.id as string),
    username: (userData?.username as string) || 'Unknown',
    displayName:
      (userData?.display_name as string | null) || (userData?.displayName as string | null) || null,
    avatarUrl:
      (userData?.avatar_url as string | null) || (userData?.avatarUrl as string | null) || null,
    avatarBorderId:
      (userData?.avatar_border_id as string | null) ||
      (userData?.avatarBorderId as string | null) ||
      null,
    avatar_border_id: (userData?.avatar_border_id as string | null) || null,
    status: 'offline',
    statusMessage: null,
    friendshipId: data.id as string,
    createdAt: (data.since as string) || (data.created_at as string) || new Date().toISOString(),
  };
}

export interface FriendState {
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
      const rawFriends = ensureArray<Record<string, unknown>>(response.data, 'data');
      const normalizedFriends = rawFriends.map(normalizeFriend);
      set({
        friends: normalizedFriends,
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
      const response = await api.get('/api/v1/friends/requests');
      const rawRequests = ensureArray<Record<string, unknown>>(response.data, 'data');
      const normalizedRequests = rawRequests.map((r) => normalizeRequest(r, 'incoming'));
      set({
        pendingRequests: normalizedRequests,
      });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to fetch pending requests'),
      });
    }
  },

  fetchSentRequests: async () => {
    try {
      const response = await api.get('/api/v1/friends/sent');
      const rawRequests = ensureArray<Record<string, unknown>>(response.data, 'data');
      const normalizedRequests = rawRequests.map((r) => normalizeRequest(r, 'outgoing'));
      set({
        sentRequests: normalizedRequests,
      });
    } catch (error: unknown) {
      set({
        error: extractErrorMessage(error, 'Failed to fetch sent requests'),
      });
    }
  },

  sendRequest: async (usernameOrIdOrEmail: string) => {
    set({ isLoading: true, error: null });
    try {
      // Determine the type of identifier
      const input = usernameOrIdOrEmail.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      // UID format: 10-digit number (new format) or 1-4 digit (legacy format)
      const cleaned = input.replace('#', '');
      const isUid = /^\d{1,10}$/.test(cleaned);

      let payload: { user_id?: string; username?: string; email?: string; uid?: string };
      if (isUuid) {
        payload = { user_id: input };
      } else if (isEmail) {
        payload = { email: input };
      } else if (isUid) {
        // Send the cleaned UID (without # prefix)
        payload = { uid: cleaned };
      } else {
        payload = { username: input };
      }

      await api.post('/api/v1/friends', payload, {
        // Force a fresh idempotency key per request to avoid reuse conflicts in dev
        headers: { 'Idempotency-Key': createIdempotencyKey() },
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
      await Promise.all([get().fetchFriends(), get().fetchPendingRequests()]);
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
