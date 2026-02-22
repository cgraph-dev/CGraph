/**
 * Forum Store — Moderation Actions
 *
 * Pin/unpin, lock/unlock, delete, thread moderation, and multi-quote.
 *
 * @module modules/forums/store/forumStore.moderation
 */

import { createLogger } from '@/lib/logger';
import { api } from './forumStore.utils';
import type { ForumState } from './forumStore.types';

const logger = createLogger('ForumStore:Moderation');

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Create moderation-related actions for the forum store. */
export function createModerationActions(set: Set, _get: Get) {
  return {
    pinPost: async (forumId: string, postId: string) => {
      try {
        await api.post(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: true } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isPinned: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'pinPost');
        throw error;
      }
    },

    unpinPost: async (forumId: string, postId: string) => {
      try {
        await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: false } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isPinned: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'unpinPost');
        throw error;
      }
    },

    lockPost: async (forumId: string, postId: string) => {
      try {
        await api.post(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: true } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isLocked: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'lockPost');
        throw error;
      }
    },

    unlockPost: async (forumId: string, postId: string) => {
      try {
        await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: false } : p)),
          currentPost:
            state.currentPost?.id === postId
              ? { ...state.currentPost, isLocked: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'unlockPost');
        throw error;
      }
    },

    deletePost: async (forumId: string, postId: string) => {
      try {
        await api.delete(`/api/v1/forums/${forumId}/posts/${postId}`);
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
          currentPost: state.currentPost?.id === postId ? null : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'deletePost');
        throw error;
      }
    },

    // ── Thread Moderation ────────────────────────────────────────────

    moveThread: async (threadId: string, targetForumId: string) => {
      try {
        await api.post(`/api/v1/posts/${threadId}/move`, { target_forum_id: targetForumId });
        set((state) => ({ posts: state.posts.filter((p) => p.id !== threadId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'moveThread');
        throw error;
      }
    },

    splitThread: async (threadId: string, postIds: string[], newTitle: string) => {
      try {
        const response = await api.post(`/api/v1/posts/${threadId}/split`, {
          post_ids: postIds,
          new_title: newTitle,
        });
        return response.data.new_thread_id;
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'splitThread');
        throw error;
      }
    },

    mergeThreads: async (sourceThreadId: string, targetThreadId: string) => {
      try {
        await api.post(`/api/v1/posts/${sourceThreadId}/merge`, {
          target_thread_id: targetThreadId,
        });
        set((state) => ({ posts: state.posts.filter((p) => p.id !== sourceThreadId) }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'mergeThreads');
        throw error;
      }
    },

    closeThread: async (threadId: string) => {
      try {
        await api.post(`/api/v1/posts/${threadId}/close`);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === threadId ? { ...p, isLocked: true, isClosed: true } : p
          ),
          currentPost:
            state.currentPost?.id === threadId
              ? { ...state.currentPost, isLocked: true, isClosed: true }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'closeThread');
        throw error;
      }
    },

    reopenThread: async (threadId: string) => {
      try {
        await api.post(`/api/v1/posts/${threadId}/reopen`);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === threadId ? { ...p, isLocked: false, isClosed: false } : p
          ),
          currentPost:
            state.currentPost?.id === threadId
              ? { ...state.currentPost, isLocked: false, isClosed: false }
              : state.currentPost,
        }));
      } catch (error: unknown) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'reopenThread');
        throw error;
      }
    },

    // ── Multi-Quote ──────────────────────────────────────────────────

    addToMultiQuote: (postId: string) => {
      set((state) => ({
        multiQuoteBuffer: state.multiQuoteBuffer.includes(postId)
          ? state.multiQuoteBuffer
          : [...state.multiQuoteBuffer, postId].slice(-20),
      }));
    },

    removeFromMultiQuote: (postId: string) => {
      set((state) => ({
        multiQuoteBuffer: state.multiQuoteBuffer.filter((id) => id !== postId),
      }));
    },

    clearMultiQuote: () => set({ multiQuoteBuffer: [] }),
  };
}
