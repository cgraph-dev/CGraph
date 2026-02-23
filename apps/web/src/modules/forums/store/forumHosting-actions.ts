import type { StoreApi } from 'zustand';
import { createLogger } from '@/lib/logger';
const logger = createLogger('forumHostingStore');
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { mapThreadFromApi, mapPostFromApi, mapMemberFromApi } from './forumHosting-mappers';

import type {
  PaginationMeta,
  CreateThreadData,
  CreatePostData,
  UpdatePostData,
  ThreadListOptions,
  PostListOptions,
  MemberListOptions,
  ForumHostingState,
} from './forumHostingStore.types';

// =============================================================================
// Thread Actions
// =============================================================================

export function createThreadActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchRecentThreads: async (forumId: string, limit: number = 20) => {
      set({ isLoadingThreads: true });
      try {
        const response = await api.get(`/api/v1/forums/${forumId}/threads`, {
          params: { limit, sort: 'latest' },
        });

        const rawThreads = ensureArray<Record<string, unknown>>(response.data, 'data');
        const threads = rawThreads.map(mapThreadFromApi);
        set({ threads, isLoadingThreads: false });
      } catch (error) {
        set({ isLoadingThreads: false });
        // Don't throw - forum may not have threads endpoint yet
        logger.warn('Failed to fetch recent threads:', error);
      }
    },

    fetchThreads: async (boardId: string, opts?: ThreadListOptions) => {
      set({ isLoadingThreads: true });
      try {
        const params = new URLSearchParams();
        if (opts?.page) params.set('page', String(opts.page));
        if (opts?.perPage) params.set('per_page', String(opts.perPage));
        if (opts?.sort) params.set('sort', opts.sort);

        const response = await api.get(`/api/v1/boards/${boardId}/threads?${params}`);

        const rawThreads = ensureArray<Record<string, unknown>>(response.data, 'data');
        const threads = rawThreads.map(mapThreadFromApi);
        const meta = response.data.meta as PaginationMeta; // safe downcast – API response field

        set({
          threads,
          threadsMeta: meta,
          isLoadingThreads: false,
        });
      } catch (error) {
        set({ isLoadingThreads: false });
        throw error;
      }
    },

    fetchThread: async (threadId: string) => {
      const response = await api.get(`/api/v1/threads/${threadId}`);
      const thread = mapThreadFromApi(response.data.data);
      set({ currentThread: thread });
      return thread;
    },

    createThread: async (boardId: string, data: CreateThreadData) => {
      const response = await api.post(`/api/v1/boards/${boardId}/threads`, {
        thread: {
          title: data.title,
          content: data.content,
          prefix: data.prefix,
        },
      });
      const thread = mapThreadFromApi(response.data.data);
      const MAX_THREADS = 500;
      set((state) => ({ threads: [thread, ...state.threads].slice(0, MAX_THREADS) }));
      return thread;
    },

    updateThread: async (threadId: string, data: Partial<CreateThreadData>) => {
      const response = await api.put(`/api/v1/threads/${threadId}`, {
        thread: {
          title: data.title,
          content: data.content,
          prefix: data.prefix,
        },
      });
      const thread = mapThreadFromApi(response.data.data);
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? thread : t)),
        currentThread: state.currentThread?.id === threadId ? thread : state.currentThread,
      }));
      return thread;
    },

    deleteThread: async (threadId: string) => {
      await api.delete(`/api/v1/threads/${threadId}`);
      set((state) => ({
        threads: state.threads.filter((t) => t.id !== threadId),
        currentThread: state.currentThread?.id === threadId ? null : state.currentThread,
      }));
    },

    pinThread: async (threadId: string, pinned: boolean) => {
      await api.post(`/api/v1/threads/${threadId}/pin`, { pinned });
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? { ...t, isPinned: pinned } : t)),
        currentThread:
          state.currentThread?.id === threadId
            ? { ...state.currentThread, isPinned: pinned }
            : state.currentThread,
      }));
    },

    lockThread: async (threadId: string, locked: boolean) => {
      await api.post(`/api/v1/threads/${threadId}/lock`, { locked });
      set((state) => ({
        threads: state.threads.map((t) => (t.id === threadId ? { ...t, isLocked: locked } : t)),
        currentThread:
          state.currentThread?.id === threadId
            ? { ...state.currentThread, isLocked: locked }
            : state.currentThread,
      }));
    },

    voteThread: async (threadId: string, value: 1 | -1) => {
      await api.post(`/api/v1/threads/${threadId}/vote`, { value });
      // Note: The backend returns accurate values, could refetch thread if needed
    },
  };
}

// =============================================================================
// Post Actions
// =============================================================================

export function createPostActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchPosts: async (threadId: string, opts?: PostListOptions) => {
      set({ isLoadingPosts: true });
      try {
        const params = new URLSearchParams();
        if (opts?.page) params.set('page', String(opts.page));
        if (opts?.perPage) params.set('per_page', String(opts.perPage));

        const response = await api.get(`/api/v1/threads/${threadId}/posts?${params}`);

        const rawPosts = ensureArray<Record<string, unknown>>(response.data, 'data');
        const posts = rawPosts.map(mapPostFromApi);
        const meta = response.data.meta as PaginationMeta; // safe downcast – API response field

        set({
          posts,
          postsMeta: meta,
          isLoadingPosts: false,
        });
      } catch (error) {
        set({ isLoadingPosts: false });
        throw error;
      }
    },

    createPost: async (threadId: string, data: CreatePostData) => {
      const response = await api.post(`/api/v1/threads/${threadId}/posts`, {
        post: {
          content: data.content,
          reply_to_id: data.replyToId,
        },
      });
      const post = mapPostFromApi(response.data.data);
      const MAX_POSTS = 500;
      set((state) => ({ posts: [...state.posts, post].slice(-MAX_POSTS) }));
      return post;
    },

    updatePost: async (threadId: string, postId: string, data: UpdatePostData) => {
      const response = await api.put(`/api/v1/threads/${threadId}/posts/${postId}`, {
        post: {
          content: data.content,
          edit_reason: data.editReason,
        },
      });
      const post = mapPostFromApi(response.data.data);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? post : p)),
      }));
      return post;
    },

    deletePost: async (threadId: string, postId: string) => {
      await api.delete(`/api/v1/threads/${threadId}/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
      }));
    },

    votePost: async (postId: string, value: 1 | -1) => {
      // Capture previous state for rollback via functional set
      let previousPosts: ForumHostingState['posts'] | undefined;
      set((state) => {
        previousPosts = state.posts;
        return {
          posts: state.posts.map((p) => {
            if (p.id !== postId) return p;
            let { upvotes, downvotes } = p;
            if (value === 1) upvotes++;
            if (value === -1) downvotes++;
            return { ...p, upvotes, downvotes, score: upvotes - downvotes };
          }),
        };
      });

      try {
        await api.post(`/api/v1/posts/${postId}/vote`, { value });
      } catch (error) {
        // Rollback on error
        if (previousPosts) {
          set({ posts: previousPosts });
        }
        logger.error('Failed to vote on post:', error);
        throw error;
      }
    },
  };
}

// =============================================================================
// Member Actions
// =============================================================================

export function createMemberActions(set: StoreApi<ForumHostingState>['setState']) {
  return {
    fetchMembers: async (forumId: string, opts: MemberListOptions = {}) => {
      set({ isLoadingMembers: true });
      try {
        const params = new URLSearchParams();
        if (opts.page) params.append('page', String(opts.page));
        if (opts.perPage) params.append('per_page', String(opts.perPage));
        if (opts.sort) params.append('sort', opts.sort);
        if (opts.role) params.append('role', opts.role);
        if (opts.search) params.append('search', opts.search);

        const response = await api.get(`/api/v1/forums/${forumId}/members?${params}`);

        const rawMembers = ensureArray<Record<string, unknown>>(response.data, 'data');
        const members = rawMembers.map(mapMemberFromApi);
        const meta = response.data.meta;
        set({
          members,
          membersMeta: meta
            ? {
                page: meta.page || 1,
                perPage: meta.per_page || 20,
                total: meta.total || members.length,
              }
            : null,
          isLoadingMembers: false,
        });
      } catch (error) {
        set({ isLoadingMembers: false });
        throw error;
      }
    },
  };
}
