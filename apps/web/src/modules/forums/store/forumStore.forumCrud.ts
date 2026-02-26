/**
 * Forum Store — Forum CRUD & Discovery Actions
 *
 * Create/update/delete forums, subscribe/unsubscribe,
 * leaderboard and top forums.
 *
 * @module modules/forums/store/forumStore.forumCrud
 */

import { createLogger } from '@/lib/logger';
import { api, ensureArray, ensureObject, mapForumFromApi } from './forumStore.utils';
import type { Forum, CreateForumData, UpdateForumData, ForumState } from './forumStore.types';

const logger = createLogger('ForumStore:ForumCrud');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create forum CRUD and discovery actions for the forum store. */
export function createForumCrudActions(set: Set, get: Get) {
  return {
    subscribe: async (forumId: string) => {
      await api.post(`/api/v1/forums/${forumId}/subscribe`);
      set((state) => ({
        forums: state.forums.map((f) =>
          f.id === forumId ? { ...f, isSubscribed: true, memberCount: f.memberCount + 1 } : f
        ),
      }));
    },

    unsubscribe: async (forumId: string) => {
      await api.delete(`/api/v1/forums/${forumId}/subscribe`);
      set((state) => ({
        forums: state.forums.map((f) =>
          f.id === forumId ? { ...f, isSubscribed: false, memberCount: f.memberCount - 1 } : f
        ),
      }));
    },

    fetchLeaderboard: async (sort = 'hot', page = 1) => {
      set({ isLoadingLeaderboard: true });
      try {
        const response = await api.get('/api/v1/forums/leaderboard', {
          params: { sort, page, per_page: 25 },
        });
        const rawForums = ensureArray<Record<string, unknown>>(response.data, 'data');
        const forums = rawForums.map(mapForumFromApi);
        const meta = response.data.meta;

        set({
          leaderboard: page === 1 ? forums : [...get().leaderboard, ...forums].slice(-500),
          leaderboardMeta: {
            page: meta.page,
            perPage: meta.per_page,
            total: meta.total,
            sort: meta.sort,
          },
          isLoadingLeaderboard: false,
        });
      } catch (error: unknown) {
        set({ isLoadingLeaderboard: false });
        throw error;
      }
    },

    fetchTopForums: async (limit = 10, sort = 'hot') => {
      const response = await api.get('/api/v1/forums/top', { params: { limit, sort } });
      const rawForums = ensureArray<Record<string, unknown>>(response.data, 'data');
      set({ topForums: rawForums.map(mapForumFromApi) });
    },

    createForum: async (data: CreateForumData) => {
      try {
        const response = await api.post('/api/v1/forums', {
          name: data.name,
          description: data.description,
          is_nsfw: data.isNsfw,
          is_private: data.isPrivate,
        });
        const forum = ensureObject<Forum>(response.data, 'forum');
        if (forum) {
          set((state) => ({ forums: [forum, ...state.forums] }));
          return forum;
        }
        throw new Error('Failed to create forum - no forum returned');
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'createForum');
        throw error;
      }
    },

    updateForum: async (forumId: string, data: UpdateForumData) => {
      try {
        const response = await api.put(`/api/v1/forums/${forumId}`, {
          name: data.name,
          description: data.description,
          is_public: data.isPublic,
          is_nsfw: data.isNsfw,
          icon_url: data.iconUrl,
          banner_url: data.bannerUrl,
          custom_css: data.customCss,
        });
        const forum = ensureObject<Forum>(response.data, 'forum');
        if (forum) {
           
          const mapped = mapForumFromApi(forum as unknown as Record<string, unknown>); // safe downcast – structural boundary
          set((state) => ({ forums: state.forums.map((f) => (f.id === forumId ? mapped : f)) }));
          return mapped;
        }
        throw new Error('Failed to update forum');
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'updateForum');
        throw error;
      }
    },

    deleteForum: async (forumId: string) => {
      try {
        await api.delete(`/api/v1/forums/${forumId}`);
        set((state) => ({ forums: state.forums.filter((f) => f.id !== forumId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteForum');
        throw error;
      }
    },
  };
}
