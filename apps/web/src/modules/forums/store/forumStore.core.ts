/**
 * Forum Store — Core Actions
 *
 * Core CRUD (forums, posts, comments), voting, sorting.
 *
 * @module modules/forums/store/forumStore.core
 */

import { api, ensureArray, ensureObject, mapForumFromApi } from './forumStore.utils';
import type { Forum, Post, Comment, CreatePostData, ForumState, ForumSearchFilters, ForumSearchResult } from './forumStore.types';

type Set = (
  partial: ForumState | Partial<ForumState> | ((s: ForumState) => ForumState | Partial<ForumState>)
) => void;
type Get = () => ForumState;

/** Data-only (non-action) fields of ForumState, used for initialization and reset. */
type ForumDataState = Pick<
  ForumState,
  | 'forums'
  | 'posts'
  | 'currentPost'
  | 'currentForum'
  | 'comments'
  | 'subscribedForums'
  | 'leaderboard'
  | 'leaderboardMeta'
  | 'topForums'
  | 'isLoadingForums'
  | 'isLoadingPosts'
  | 'isLoadingComments'
  | 'isLoadingLeaderboard'
  | 'hasMorePosts'
  | 'sortBy'
  | 'timeRange'
  | 'threadPrefixes'
  | 'subscriptions'
  | 'userGroups'
  | 'moderationQueue'
  | 'reports'
  | 'multiQuoteBuffer'
  | 'searchResults'
  | 'searchQuery'
  | 'searchFilters'
  | 'searchLoading'
  | 'searchHasMore'
  | 'searchCursor'
>;

/** Initial state values for the forum store. */
export const forumInitialState: ForumDataState = {
  forums: [],
  posts: [],
  currentPost: null,
  currentForum: null,
  comments: {},
  subscribedForums: [],
  leaderboard: [],
  leaderboardMeta: null,
  topForums: [],
  isLoadingForums: false,
  isLoadingPosts: false,
  isLoadingComments: false,
  isLoadingLeaderboard: false,
  hasMorePosts: true,
  sortBy: 'hot',
  timeRange: 'day',
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  moderationQueue: [],
  reports: [],
  multiQuoteBuffer: [],
  searchResults: [],
  searchQuery: '',
  searchFilters: {},
  searchLoading: false,
  searchHasMore: false,
  searchCursor: undefined,
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
            : [...state.forums, forum].slice(-200),
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

        const MAX_POSTS = 500;
        set((state) => {
          const merged = page === 1 ? newPosts : [...state.posts, ...newPosts];
          return {
            posts: merged.length > MAX_POSTS ? merged.slice(merged.length - MAX_POSTS) : merged,
            hasMorePosts: newPosts.length === 25,
            isLoadingPosts: false,
          };
        });
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
        const MAX_COMMENTS_PER_POST = 500;
        set((state) => {
          const postComments = state.comments[postId] || [];
          if (parentId) {
            return { comments: { ...state.comments, [postId]: postComments } };
          }
          const updated = [comment, ...postComments];
          return {
            comments: {
              ...state.comments,
              [postId]:
                updated.length > MAX_COMMENTS_PER_POST
                  ? updated.slice(0, MAX_COMMENTS_PER_POST)
                  : updated,
            },
          };
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

    // ── Search ─────────────────────────────────────────────────────

    searchForums: async (query: string, filters?: ForumSearchFilters) => {
      set({ searchLoading: true, searchQuery: query, searchFilters: filters || {} });
      try {
        const params = new URLSearchParams({ q: query });
        if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
        if (filters?.forumId) params.set('forum_id', filters.forumId);
        if (filters?.boardId) params.set('board_id', filters.boardId);
        if (filters?.authorId) params.set('author_id', filters.authorId);
        if (filters?.dateFrom) params.set('date_from', filters.dateFrom);
        if (filters?.dateTo) params.set('date_to', filters.dateTo);
        if (filters?.sort) params.set('sort', filters.sort);
        const response = await api.get(`/api/v1/search/forums?${params}`);
        const results = ensureArray<ForumSearchResult>(response.data, 'data');
        const cursor = response.data?.meta?.cursor;
        const hasMore = response.data?.meta?.has_more ?? false;
        set({ searchResults: results, searchCursor: cursor, searchHasMore: hasMore, searchLoading: false });
      } catch (error) {
        set({ searchLoading: false });
        throw error;
      }
    },

    searchMore: async () => {
      const { searchQuery, searchFilters, searchCursor, searchHasMore } = get();
      if (!searchHasMore || !searchCursor) return;
      set({ searchLoading: true });
      try {
        const params = new URLSearchParams({ q: searchQuery, cursor: searchCursor });
        if (searchFilters?.type && searchFilters.type !== 'all') params.set('type', searchFilters.type);
        if (searchFilters?.forumId) params.set('forum_id', searchFilters.forumId);
        const response = await api.get(`/api/v1/search/forums?${params}`);
        const results = ensureArray<ForumSearchResult>(response.data, 'data');
        const cursor = response.data?.meta?.cursor;
        const hasMore = response.data?.meta?.has_more ?? false;
        set((state) => ({
          searchResults: [...state.searchResults, ...results],
          searchCursor: cursor,
          searchHasMore: hasMore,
          searchLoading: false,
        }));
      } catch (error) {
        set({ searchLoading: false });
        throw error;
      }
    },

    clearSearch: () => set({ searchResults: [], searchQuery: '', searchFilters: {}, searchCursor: undefined, searchHasMore: false }),

    // ── Comment Edit/Delete ─────────────────────────────────────────

    editComment: async (postId: string, commentId: string, content: string) => {
      const response = await api.put(`/api/v1/comments/${commentId}`, { content });
      const updated = ensureObject<Comment>(response.data, 'comment');
      if (updated) {
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: (state.comments[postId] || []).map((c) => c.id === commentId ? { ...c, ...updated } : c),
          },
        }));
      }
    },

    deleteComment: async (postId: string, commentId: string) => {
      await api.delete(`/api/v1/comments/${commentId}`);
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] || []).filter((c) => c.id !== commentId),
        },
      }));
    },
  };
}
