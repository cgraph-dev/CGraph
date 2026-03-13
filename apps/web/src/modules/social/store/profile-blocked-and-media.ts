/**
 * Profile blocked users and media store actions.
 * @module
 */
import { api } from '@/lib/api';
import { ensureArray, isRecord } from '@/lib/apiUtils';
import { asString, asBool } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import type { StoreApi } from 'zustand';
import type { ProfileField, ProfileState } from './profileStore.types';

const logger = createLogger('profileStore');

type Set = StoreApi<ProfileState>['setState'];
type Get = () => ProfileState;

/** Fetch the list of blocked users. */
export function createFetchBlockedUsers(set: Set) {
  return async () => {
    set({ isLoadingBlocked: true });
    try {
      const response = await api.get('/api/v1/users/me/blocked');
      const blockedUsers = ensureArray(response.data, 'blocked')
        .filter(isRecord)
        .map((u) => ({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          id: u.id as string, // type assertion: API response field narrowed from unknown

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          username: u.username as string, // type assertion: API response field narrowed from unknown

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          displayName: (u.display_name as string) || null, // type assertion: API response field narrowed from unknown

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          avatarUrl: (u.avatar_url as string) || null, // type assertion: API response field narrowed from unknown

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          blockedAt: u.blocked_at as string, // type assertion: API response field narrowed from unknown

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          reason: (u.reason as string) || undefined, // type assertion: API response field narrowed from unknown
        }));
      set({ blockedUsers, isLoadingBlocked: false });
    } catch (error) {
      logger.error('Failed to fetch blocked users:', error);
      set({ isLoadingBlocked: false });
      throw error;
    }
  };
}

/** Block a user. */
export function createBlockUser(set: Set, get: Get) {
  return async (userId: string, reason?: string) => {
    try {
      await api.post('/api/v1/users/me/blocked', {
        user_id: userId,
        reason,
      });
      // Refresh blocked list
      await get().fetchBlockedUsers();
      // Update current profile if viewing blocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({ currentProfile: { ...current, isBlocked: true } });
      }

      // Remove blocked user from friend store (friends list + pending requests + presence)
      try {
        const { useFriendStore } = await import('./friendStore.impl');
        const friendState = useFriendStore.getState();
        useFriendStore.setState({
          friends: friendState.friends.filter((f) => f.id !== userId),
          pendingRequests: friendState.pendingRequests.filter((r) => r.user.id !== userId),
          sentRequests: friendState.sentRequests.filter((r) => r.user.id !== userId),
        });
      } catch {
        // friendStore import failure is non-critical
        logger.warn('Could not update friend store after block');
      }
    } catch (error) {
      logger.error('Failed to block user:', error);
      throw error;
    }
  };
}

/** Unblock a user. */
export function createUnblockUser(set: Set, get: Get) {
  return async (userId: string) => {
    try {
      await api.delete(`/api/v1/users/me/blocked/${userId}`);
      set((state) => ({
        blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
      }));
      // Update current profile if viewing unblocked user
      const current = get().currentProfile;
      if (current?.id === userId) {
        set({ currentProfile: { ...current, isBlocked: false } });
      }
    } catch (error) {
      logger.error('Failed to unblock user:', error);
      throw error;
    }
  };
}

/** Check if a user is blocked. */
export function createIsUserBlocked(get: Get) {
  return (userId: string) => {
    return get().blockedUsers.some((u) => u.id === userId);
  };
}

/** Upload an avatar image. */
export function createUploadAvatar(set: Set) {
  return async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const avatarUrl = response.data.avatar_url || response.data.url;

    set((state) => ({
      myProfile: state.myProfile ? { ...state.myProfile, avatarUrl } : null,
    }));

    return avatarUrl;
  };
}

/** Upload a banner image. */
export function createUploadBanner(set: Set) {
  return async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/v1/users/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const bannerUrl = response.data.banner_url || response.data.url;

    set((state) => ({
      myProfile: state.myProfile ? { ...state.myProfile, bannerUrl } : null,
    }));

    return bannerUrl;
  };
}

/** Fetch available profile fields. */
export function createFetchProfileFields(set: Set) {
  return async () => {
    try {
      const response = await api.get('/api/v1/profile-fields');
      const fields = ensureArray(response.data, 'fields')
        .filter(isRecord)
        .map((f) => ({
          id: asString(f.id),
          name: asString(f.name),

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          type: (f.type as ProfileField['type']) || 'text', // type assertion: narrowing unknown to union type after API boundary
          value: null,

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          options: f.options as string[] | undefined, // safe downcast – structural boundary
          required: asBool(f.required),
          editable: asBool(f.editable, true),
          visible: asBool(f.visible, true),
        }));
      set({ availableFields: fields });
    } catch (error) {
      logger.error('Failed to fetch profile fields:', error);
    }
  };
}

/** Clear the currently viewed profile. */
export function createClearProfile(set: Set) {
  return () => {
    set({
      currentProfile: null,
      profileError: null,
    });
  };
}
