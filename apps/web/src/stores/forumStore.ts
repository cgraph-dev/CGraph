import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';

export interface Forum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  customCss: string | null;
  isNsfw: boolean;
  isPrivate: boolean;
  memberCount: number;
  categories: ForumCategory[];
  moderators: ForumModerator[];
  isSubscribed: boolean;
  createdAt: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  color: string;
}

export interface ForumModerator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  forumId: string;
  authorId: string;
  title: string;
  content: string;
  postType: 'text' | 'link' | 'image' | 'video' | 'poll';
  linkUrl: string | null;
  mediaUrls: string[];
  isPinned: boolean;
  isLocked: boolean;
  isNsfw: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  hotScore: number;
  commentCount: number;
  myVote: 1 | -1 | null;
  category: ForumCategory | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  forum: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: 1 | -1 | null;
  isCollapsed: boolean;
  depth: number;
  children: Comment[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

type SortOption = 'hot' | 'new' | 'top' | 'controversial';
type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

interface ForumState {
  forums: Forum[];
  posts: Post[];
  currentPost: Post | null;
  comments: Record<string, Comment[]>;
  subscribedForums: Forum[];
  isLoadingForums: boolean;
  isLoadingPosts: boolean;
  isLoadingComments: boolean;
  hasMorePosts: boolean;
  sortBy: SortOption;
  timeRange: TimeRange;

  // Actions
  fetchForums: () => Promise<void>;
  fetchForum: (slug: string) => Promise<Forum>;
  fetchPosts: (forumSlug?: string, page?: number) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<Comment>;
  vote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
  subscribe: (forumId: string) => Promise<void>;
  unsubscribe: (forumId: string) => Promise<void>;
  setSortBy: (sort: SortOption) => void;
  setTimeRange: (range: TimeRange) => void;
  createForum: (data: CreateForumData) => Promise<Forum>;
}

interface CreatePostData {
  forumId: string;
  title: string;
  content: string;
  postType: 'text' | 'link' | 'image' | 'video';
  linkUrl?: string;
  mediaUrls?: string[];
  categoryId?: string;
  isNsfw?: boolean;
}

interface CreateForumData {
  name: string;
  description?: string;
  isNsfw?: boolean;
  isPrivate?: boolean;
}

export const useForumStore = create<ForumState>((set, get) => ({
  forums: [],
  posts: [],
  currentPost: null,
  comments: {},
  subscribedForums: [],
  isLoadingForums: false,
  isLoadingPosts: false,
  isLoadingComments: false,
  hasMorePosts: true,
  sortBy: 'hot',
  timeRange: 'day',

  fetchForums: async () => {
    set({ isLoadingForums: true });
    try {
      const response = await api.get('/api/v1/forums');
      set({
        forums: ensureArray<Forum>(response.data, 'forums'),
        isLoadingForums: false,
      });
    } catch (error) {
      set({ isLoadingForums: false });
      throw error;
    }
  },

  fetchForum: async (slug: string) => {
    try {
      const response = await api.get(`/api/v1/forums/${slug}`);
      const forum = ensureObject<Forum>(response.data, 'forum');
      if (forum) {
        set((state) => ({
          forums: state.forums.some((f) => f.id === forum.id)
            ? state.forums.map((f) => (f.id === forum.id ? forum : f))
            : [...state.forums, forum],
        }));
        return forum;
      }
      throw new Error('Forum not found');
    } catch (error) {
      throw error;
    }
  },

  fetchPosts: async (forumSlug?: string, page: number = 1) => {
    set({ isLoadingPosts: true });
    try {
      const { sortBy, timeRange } = get();
      const params: Record<string, string | number> = {
        sort: sortBy,
        page,
        limit: 25,
      };
      if (sortBy === 'top') {
        params.time = timeRange;
      }

      const endpoint = forumSlug
        ? `/api/v1/forums/${forumSlug}/posts`
        : '/api/v1/posts/feed';

      const response = await api.get(endpoint, { params });
      const newPosts = ensureArray<Post>(response.data, 'posts');

      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        hasMorePosts: newPosts.length === 25,
        isLoadingPosts: false,
      }));
    } catch (error) {
      set({ isLoadingPosts: false });
      throw error;
    }
  },

  fetchPost: async (postId: string) => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}`);
      const post = ensureObject<Post>(response.data, 'post');
      set({ currentPost: post });
    } catch (error) {
      throw error;
    }
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
    } catch (error) {
      set({ isLoadingComments: false });
      throw error;
    }
  },

  createPost: async (data: CreatePostData) => {
    const response = await api.post('/api/v1/posts', {
      forum_id: data.forumId,
      title: data.title,
      content: data.content,
      post_type: data.postType,
      link_url: data.linkUrl,
      media_urls: data.mediaUrls,
      category_id: data.categoryId,
      is_nsfw: data.isNsfw,
    });
    const post = ensureObject<Post>(response.data, 'post');
    if (post) {
      set((state) => ({
        posts: [post, ...state.posts],
      }));
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
          // Add as child to parent comment (simplified, actual tree logic more complex)
          return {
            comments: {
              ...state.comments,
              [postId]: postComments, // Would need proper tree insertion
            },
          };
        }
        return {
          comments: {
            ...state.comments,
            [postId]: [comment, ...postComments],
          },
        };
      });
      return comment;
    }
    throw new Error('Failed to create comment');
  },

  vote: async (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => {
    const endpoint = type === 'post' ? `/api/v1/posts/${id}/vote` : `/api/v1/comments/${id}/vote`;

    if (value === null) {
      await api.delete(endpoint);
    } else {
      await api.post(endpoint, { value });
    }

    if (type === 'post') {
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== id) return p;
          const oldVote = p.myVote;
          let upvotes = p.upvotes;
          let downvotes = p.downvotes;

          // Remove old vote
          if (oldVote === 1) upvotes--;
          if (oldVote === -1) downvotes--;

          // Add new vote
          if (value === 1) upvotes++;
          if (value === -1) downvotes++;

          return {
            ...p,
            myVote: value,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
          };
        }),
        currentPost:
          state.currentPost?.id === id
            ? {
                ...state.currentPost,
                myVote: value,
              }
            : state.currentPost,
      }));
    }
  },

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

  setSortBy: (sort: SortOption) => {
    set({ sortBy: sort, posts: [], hasMorePosts: true });
  },

  setTimeRange: (range: TimeRange) => {
    set({ timeRange: range, posts: [], hasMorePosts: true });
  },

  createForum: async (data: CreateForumData) => {
    const response = await api.post('/api/v1/forums', {
      name: data.name,
      description: data.description,
      is_nsfw: data.isNsfw,
      is_private: data.isPrivate,
    });
    const forum = ensureObject<Forum>(response.data, 'forum');
    if (forum) {
      set((state) => ({
        forums: [forum, ...state.forums],
      }));
      return forum;
    }
    throw new Error('Failed to create forum');
  },
}));
