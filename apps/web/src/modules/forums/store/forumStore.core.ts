/**
 * Forum Store — Core Actions
 *
 * Core CRUD (forums, posts, comments), voting, sorting.
 *
 * @module modules/forums/store/forumStore.core
 */

import { api, ensureArray, ensureObject, mapForumFromApi } from './forumStore.utils';
import type { Forum, Post, Comment, CreatePostData, ForumState } from './forumStore.types';

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Initial state values for the forum store. */
export const forumInitialState = {
  forums: [] as Forum[],
  posts: [] as Post[],
  currentPost: null as Post | null,
  currentForum: null as Forum | null,
  comments: {} as Record<string, Comment[]>,
  subscribedForums: [] as Forum[],
  leaderboard: [] as Forum[],
  leaderboardMeta: null as ForumState['leaderboardMeta'],
  topForums: [] as Forum[],
  isLoadingForums: false,
  isLoadingPosts: false,
  isLoadingComments: false,
  isLoadingLeaderboard: false,
  hasMorePosts: true,
  sortBy: 'hot' as const,
  timeRange: 'day' as const,
  threadPrefixes: [] as ForumState['threadPrefixes'],
  subscriptions: [] as ForumState['subscriptions'],
  userGroups: [] as ForumState['userGroups'],
  moderationQueue: [] as ForumState['moderationQueue'],
  reports: [] as ForumState['reports'],
  multiQuoteBuffer: [] as string[],
};

/** Create core CRUD + voting actions for the forum store. */
export function createCoreActions(set: Set, get: Get) {
  return {
    fetchForums: async () => {
      set({ isLoadingForums: true });
      try {
        const response = await api.get('/api/v1/forums');
        const rawForums = ensureArray<Record<string, unknown>>(response.data, 'forums');
        const forums = rawForums.map(mapForumFromApi);
        set({ forums, isLoadingForums: false });
      } catch (error: unknown) {
        set({ isLoadingForums: false });
        throw error;
      }
    },

    fetchForum: async (slug: string) => {
      const response = await api.get(`/api/v1/forums/${slug}`);
      const rawData = ensureObject<Record<string, unknown>>(response.data, 'forum');
      if (rawData) {
        const forum = mapForumFromApi(rawData);
        set((state) => ({
          currentForum: forum,
          forums: state.forums.some((f) => f.id === forum.id)
            ? state.forums.map((f) => (f.id === forum.id ? forum : f))
            : [...state.forums, forum],
        }));
        return forum;
      }
      throw new Error('Forum not found');
    },

    fetchPosts: async (forumSlug?: string, page: number = 1) => {
      set({ isLoadingPosts: true });
      try {
        const { sortBy, timeRange } = get();
        const params: Record<string, string | number> = { sort: sortBy, page, limit: 25 };
        if (sortBy === 'top') params.time = timeRange;

        const endpoint = forumSlug ? `/api/v1/forums/${forumSlug}/posts` : '/api/v1/posts/feed';
        const response = await api.get(endpoint, { params });
        const newPosts = ensureArray<Post>(response.data, 'posts');

        set((state) => ({
          posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
          hasMorePosts: newPosts.length === 25,
          isLoadingPosts: false,
        }));
      } catch (error: unknown) {
        set({ isLoadingPosts: false });
        throw error;
      }
    },

    fetchPost: async (postId: string) => {
      const response = await api.get(`/api/v1/posts/${postId}`);
      const post = ensureObject<Post>(response.data, 'post');
      set({ currentPost: post });
    },

    fetchComments: async (postId: string) => {
      set({ isLoadingComments: true });
      try {
        const response = await api.get(`/api/v1/posts/${postId}/comments`);
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: ensureArray<Comment>(response.data, 'comments'),
          },
          isLoadingComments: false,
        }));
      } catch (error: unknown) {
        set({ isLoadingComments: false });
        throw error;
      }
    },

    createPost: async (data: CreatePostData) => {
      const payload: Record<string, unknown> = {
        forum_id: data.forumId,
        title: data.title,
        content: data.content,
        post_type: data.postType,
        link_url: data.linkUrl,
        media_urls: data.mediaUrls,
        category_id: data.categoryId,
        is_nsfw: data.isNsfw,
      };

      if (data.prefixId) payload.prefix_id = data.prefixId;
      if (data.attachmentIds?.length) payload.attachment_ids = data.attachmentIds;

      if (data.postType === 'poll' && data.poll) {
        payload.poll = {
          question: data.poll.question,
          options: data.poll.options.filter((opt) => opt.trim() !== ''),
          allow_multiple: data.poll.allowMultiple || false,
          is_public: data.poll.isPublic || false,
          expires_at: data.poll.expiresAt,
        };
      }

      const response = await api.post('/api/v1/posts', payload);
      const post = ensureObject<Post>(response.data, 'post');
      if (post) {
        set((state) => ({ posts: [post, ...state.posts] }));
        return post;
      }
      throw new Error('Failed to create post');
    },

    createComment: async (postId: string, content: string, parentId?: string) => {
      const response = await api.post(`/api/v1/posts/${postId}/comments`, {
        content,
        parent_id: parentId,
      });
      const comment = ensureObject<Comment>(response.data, 'comment');
      if (comment) {
        set((state) => {
          const postComments = state.comments[postId] || [];
          if (parentId) {
            return { comments: { ...state.comments, [postId]: postComments } };
          }
          return { comments: { ...state.comments, [postId]: [comment, ...postComments] } };
        });
        return comment;
      }
      throw new Error('Failed to create comment');
    },

    // ── Voting ─────────────────────────────────────────────────────

    vote: async (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => {
      const endpoint = type === 'post' ? `/api/v1/posts/${id}/vote` : `/api/v1/comments/${id}/vote`;
      const previousPosts = get().posts;
      const previousCurrentPost = get().currentPost;

      if (type === 'post') {
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== id) return p;
            const oldVote = p.myVote;
            let upvotes = p.upvotes;
            let downvotes = p.downvotes;
            if (oldVote === 1) upvotes--;
            if (oldVote === -1) downvotes--;
            if (value === 1) upvotes++;
            if (value === -1) downvotes++;
            return { ...p, myVote: value, upvotes, downvotes, score: upvotes - downvotes };
          }),
          currentPost:
            state.currentPost?.id === id
              ? { ...state.currentPost, myVote: value }
              : state.currentPost,
        }));
      }

      try {
        if (value === null) {
          await api.delete(endpoint);
        } else {
          await api.post(endpoint, { value });
        }
      } catch (error: unknown) {
        if (type === 'post') {
          set({ posts: previousPosts, currentPost: previousCurrentPost });
        }
        throw error;
      }
    },

    voteForum: async (forumId: string, value: 1 | -1) => {
      const response = await api.post(`/api/v1/forums/${forumId}/vote`, { value });
      const result = response.data;

      const updateForum = (forum: Forum) => {
        if (forum.id !== forumId) return forum;
        return {
          ...forum,
          score: result.forum.score,
          upvotes: result.forum.upvotes,
          downvotes: result.forum.downvotes,
          userVote: result.forum.user_vote,
        };
      };

      set((state) => ({
        forums: state.forums.map(updateForum),
        leaderboard: state.leaderboard.map(updateForum),
        topForums: state.topForums.map(updateForum),
      }));
    },

    // ── Sort / Filter ──────────────────────────────────────────────

    setSortBy: (sort: ForumState['sortBy']) => set({ sortBy: sort, posts: [], hasMorePosts: true }),
    setTimeRange: (range: ForumState['timeRange']) =>
      set({ timeRange: range, posts: [], hasMorePosts: true }),
  };
}
