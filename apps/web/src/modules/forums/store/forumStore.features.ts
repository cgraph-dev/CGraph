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

    fetchThreadPrefixes: async () => {
      const standardPrefixes: ThreadPrefix[] = [
        { id: 'discussion', name: 'Discussion', color: '#3B82F6', isDefault: true },
        { id: 'question', name: 'Question', color: '#8B5CF6', isDefault: false },
        { id: 'help', name: 'Help', color: '#EF4444', isDefault: false },
        { id: 'solved', name: 'Solved', color: '#10B981', isDefault: false },
        { id: 'announcement', name: 'Announcement', color: '#F59E0B', isDefault: false },
        { id: 'guide', name: 'Guide', color: '#06B6D4', isDefault: false },
        { id: 'news', name: 'News', color: '#EC4899', isDefault: false },
        { id: 'bug', name: 'Bug', color: '#DC2626', isDefault: false },
        { id: 'feature', name: 'Feature Request', color: '#7C3AED', isDefault: false },
      ];
      set({ threadPrefixes: standardPrefixes });
    },

    createThreadPrefix: async (data: CreateThreadPrefixData) => {
      try {
        const response = await api.post('/api/v1/admin/thread-prefixes', {
          name: data.name,
          color: data.color,
          forums: data.forums,
        });
        const prefix = response.data.prefix;
        set((state) => ({ threadPrefixes: [...state.threadPrefixes, prefix] }));
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
        return response.data.attachment as PostAttachment;
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
        return response.data.poll as Poll;
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
          ],
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
  };
}
