/**
 * Forum Store — Feature Actions
 *
 * Thread prefixes, ratings, attachments, edit history,
 * polls, and thread subscriptions.
 *
 * @module modules/forums/store/forumStore.features
 */

import { createLogger } from '@/lib/logger';
import { api, ensureArray } from './forumStore.utils';
import type {
  ThreadPrefix,
  ThreadRating,
  PostAttachment,
  PostEditHistory,
  Poll,
  Subscription,
  CreateThreadPrefixData,
  CreatePollData,
  ForumState,
  ForumCategory,
} from './forumStore.types';

const logger = createLogger('ForumStore:Features');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create feature actions (prefixes, ratings, attachments, polls, subscriptions). */
export function createFeatureActions(set: Set, _get: Get) {
  return {
    // ── Thread Prefixes ──────────────────────────────────────────────

    fetchThreadPrefixes: async (forumId?: string) => {
      try {
        const url = forumId
          ? `/api/v1/forums/${forumId}/thread-prefixes`
          : '/api/v1/admin/thread-prefixes';
        const response = await api.get(url);
        const prefixes = ensureArray<ThreadPrefix>(response.data, 'prefixes');
        set({ threadPrefixes: prefixes });
      } catch {
        // Fallback to defaults if API not available
        set({
          threadPrefixes: [
            { id: 'discussion', name: 'Discussion', color: '#3B82F6', isDefault: true },
            { id: 'question', name: 'Question', color: '#8B5CF6' },
            { id: 'help', name: 'Help', color: '#EF4444' },
            { id: 'solved', name: 'Solved', color: '#10B981' },
          ],
        });
      }
    },

    createThreadPrefix: async (data: CreateThreadPrefixData) => {
      try {
        const response = await api.post('/api/v1/admin/thread-prefixes', {
          name: data.name,
          color: data.color,
          forums: data.forums,
        });
        const prefix = response.data.prefix;
        const MAX_THREAD_PREFIXES = 100;
        set((state) => ({
          threadPrefixes: [...state.threadPrefixes, prefix].slice(-MAX_THREAD_PREFIXES),
        }));
        return prefix;
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'createThreadPrefix'
        );
        throw error;
      }
    },

    deleteThreadPrefix: async (prefixId: string) => {
      try {
        await api.delete(`/api/v1/admin/thread-prefixes/${prefixId}`);
        set((state) => ({
          threadPrefixes: state.threadPrefixes.filter((p) => p.id !== prefixId),
        }));
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'deleteThreadPrefix'
        );
        throw error;
      }
    },

    // ── Thread Ratings ───────────────────────────────────────────────

    rateThread: async (threadId: string, rating: number) => {
      try {
        const response = await api.post(`/api/v1/posts/${threadId}/rate`, { rating });
        const result = response.data;
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === threadId
              ? {
                  ...p,
                  rating: result.average_rating,
                  ratingCount: result.rating_count,
                  myRating: rating,
                }
              : p
          ),
          currentPost:
            state.currentPost?.id === threadId
              ? {
                  ...state.currentPost,
                  rating: result.average_rating,
                  ratingCount: result.rating_count,
                  myRating: rating,
                }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'rateThread');
        throw error;
      }
    },

    fetchThreadRatings: async (threadId: string) => {
      try {
        const response = await api.get(`/api/v1/posts/${threadId}/ratings`);
        return ensureArray<ThreadRating>(response.data, 'ratings');
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchThreadRatings'
        );
        return [];
      }
    },

    // ── Attachments ──────────────────────────────────────────────────

    uploadAttachment: async (file: File, postId?: string) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (postId) formData.append('post_id', postId);
        const response = await api.post('/api/v1/attachments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return response.data.attachment as PostAttachment; // safe downcast – API response field
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'uploadAttachment');
        throw error;
      }
    },

    deleteAttachment: async (attachmentId: string) => {
      try {
        await api.delete(`/api/v1/attachments/${attachmentId}`);
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteAttachment');
        throw error;
      }
    },

    // ── Edit History ─────────────────────────────────────────────────

    fetchEditHistory: async (postId: string) => {
      try {
        const response = await api.get(`/api/v1/posts/${postId}/edit-history`);
        return ensureArray<PostEditHistory>(response.data, 'history');
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchEditHistory');
        return [];
      }
    },

    // ── Polls ────────────────────────────────────────────────────────

    createPoll: async (threadId: string, data: CreatePollData) => {
      try {
        const response = await api.post(`/api/v1/posts/${threadId}/poll`, {
          question: data.question,
          options: data.options,
          allow_multiple: data.allowMultiple,
          max_selections: data.maxSelections,
          timeout: data.timeout,
          public: data.public,
        });

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return response.data.poll as Poll; // safe downcast – API response field
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'createPoll');
        throw error;
      }
    },

    votePoll: async (pollId: string, optionIds: string[]) => {
      try {
        await api.post(`/api/v1/polls/${pollId}/vote`, { option_ids: optionIds });
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'votePoll');
        throw error;
      }
    },

    closePoll: async (pollId: string) => {
      try {
        await api.post(`/api/v1/polls/${pollId}/close`);
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'closePoll');
        throw error;
      }
    },

    // ── Thread Subscriptions ─────────────────────────────────────────

    subscribeThread: async (
      threadId: string,
      notificationMode: Subscription['notificationMode']
    ) => {
      try {
        await api.post(`/api/v1/posts/${threadId}/subscribe`, {
          notification_mode: notificationMode,
        });
        const MAX_SUBSCRIPTIONS = 500;
        set((state) => ({
          subscriptions: [
            ...state.subscriptions,
            {
              id: `sub-${threadId}`,
              userId: '',
              entityType: 'thread' as const,
              entityId: threadId,
              notificationMode,
              createdAt: new Date().toISOString(),
            },
          ].slice(-MAX_SUBSCRIPTIONS),
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'subscribeThread');
        throw error;
      }
    },

    unsubscribeThread: async (threadId: string) => {
      try {
        await api.delete(`/api/v1/posts/${threadId}/subscribe`);
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.entityId !== threadId),
        }));
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'unsubscribeThread'
        );
        throw error;
      }
    },

    updateSubscription: async (
      subscriptionId: string,
      notificationMode: Subscription['notificationMode']
    ) => {
      try {
        await api.put(`/api/v1/subscriptions/${subscriptionId}`, {
          notification_mode: notificationMode,
        });
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === subscriptionId ? { ...s, notificationMode } : s
          ),
        }));
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'updateSubscription'
        );
        throw error;
      }
    },

    fetchSubscriptions: async () => {
      try {
        const response = await api.get('/api/v1/subscriptions');
        set({ subscriptions: ensureArray<Subscription>(response.data, 'subscriptions') });
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'fetchSubscriptions'
        );
      }
    },

    // ── Category CRUD ────────────────────────────────────────────────

    fetchCategories: async (forumId: string) => {
      try {
        const response = await api.get(`/api/v1/forums/${forumId}/categories`);
        const categories = ensureArray<ForumCategory>(response.data, 'categories');
        set((state) => ({
          currentForum:
            state.currentForum?.id === forumId
              ? { ...state.currentForum, categories }
              : state.currentForum,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchCategories');
      }
    },

    createCategory: async (
      forumId: string,
      data: { name: string; color?: string; description?: string }
    ) => {
      try {
        const response = await api.post(`/api/v1/forums/${forumId}/categories`, data);
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const category = response.data?.category as ForumCategory | undefined;
        if (category) {
          set((state) => ({
            currentForum:
              state.currentForum?.id === forumId
                ? {
                    ...state.currentForum,
                    categories: [...(state.currentForum.categories || []), category],
                  }
                : state.currentForum,
          }));
        }
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'createCategory');
        throw error;
      }
    },

    updateCategory: async (forumId: string, categoryId: string, data: Partial<ForumCategory>) => {
      try {
        await api.put(`/api/v1/forums/${forumId}/categories/${categoryId}`, data);
        set((state) => ({
          currentForum:
            state.currentForum?.id === forumId
              ? {
                  ...state.currentForum,
                  categories: (state.currentForum.categories || []).map((c) =>
                    c.id === categoryId ? { ...c, ...data } : c
                  ),
                }
              : state.currentForum,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'updateCategory');
        throw error;
      }
    },

    deleteCategory: async (forumId: string, categoryId: string) => {
      try {
        await api.delete(`/api/v1/forums/${forumId}/categories/${categoryId}`);
        set((state) => ({
          currentForum:
            state.currentForum?.id === forumId
              ? {
                  ...state.currentForum,
                  categories: (state.currentForum.categories || []).filter(
                    (c) => c.id !== categoryId
                  ),
                }
              : state.currentForum,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteCategory');
        throw error;
      }
    },

    reorderCategories: async (forumId: string, categoryIds: string[]) => {
      try {
        await api.put(`/api/v1/forums/${forumId}/categories/reorder`, {
          category_ids: categoryIds,
        });
        set((state) => {
          if (state.currentForum?.id !== forumId) return {};
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const ordered = categoryIds
            .map((id) => (state.currentForum!.categories || []).find((c) => c.id === id))
            .filter(Boolean) as ForumCategory[];
          return { currentForum: { ...state.currentForum!, categories: ordered } };
        });
      } catch (error: unknown) {
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          'reorderCategories'
        );
        throw error;
      }
    },
  };
}
