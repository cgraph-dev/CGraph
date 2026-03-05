/**
 * Friend Store
 *
 * Manages friend list, friend requests, and user blocking functionality.
 * Provides real-time presence updates and friend status tracking.
 *
 * @module stores/friendStore
 * @version 0.9.9
 * @since v0.1.0
 */

import { create } from 'zustand';
import { createIdempotencyKey } from '@cgraph/utils';
import { api } from '@/lib/api';
import { ensureArray, extractErrorMessage } from '@/lib/apiUtils';

// Re-export types so existing consumers keep working
export type { Friend, FriendRequest, FriendState } from './friend-types';

import type { FriendState } from './friend-types';
import { normalizeFriend, normalizeRequest } from './friend-normalizers';

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
      // Update friends list optimistically — friendId is the friendship record ID
      set((state) => ({
        friends: state.friends.filter((f) => f.friendshipId !== friendId),
        sentRequests: state.sentRequests.filter((r) => r.id !== friendId),
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

  reset: () =>
    set({
      friends: [],
      pendingRequests: [],
      sentRequests: [],
      isLoading: false,
      error: null,
    }),
}));
