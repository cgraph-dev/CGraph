/**
 * Mobile Forum Store — Zustand store for centralized forum state.
 *
 * Manages: forums list, current forum, boards, threads, posts, comments,
 * search results, and loading/error state.
 *
 * Follows the pattern established by chatStore, groupStore, etc.
 *
 * @module stores/forumStore
 */

import { create } from 'zustand';
import { forumService } from '../services/forumService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Forum {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly icon_url?: string | null;
  readonly member_count?: number;
  readonly post_count?: number;
  readonly owner_id?: string;
  readonly settings?: Record<string, unknown>;
  readonly inserted_at?: string;
  [key: string]: unknown;
}

interface Board {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly forum_id: string;
  readonly thread_count?: number;
  readonly post_count?: number;
  [key: string]: unknown;
}

interface Thread {
  readonly id: string;
  readonly title: string;
  readonly content?: string;
  readonly author?: { id: string; username: string; display_name?: string };
  readonly forum_id?: string;
  readonly vote_count?: number;
  readonly comment_count?: number;
  readonly inserted_at?: string;
  [key: string]: unknown;
}

interface Comment {
  readonly id: string;
  readonly content: string;
  readonly author?: { id: string; username: string; display_name?: string };
  readonly post_id?: string;
  readonly parent_id?: string | null;
  readonly vote_count?: number;
  readonly replies?: Comment[];
  readonly inserted_at?: string;
  [key: string]: unknown;
}

interface SearchResult {
  readonly id: string;
  readonly type: 'thread' | 'post' | 'comment';
  readonly title?: string;
  readonly content?: string;
  readonly author?: { id: string; username: string; display_name?: string };
  readonly forum?: { id: string; name: string; slug: string };
  readonly inserted_at?: string;
  [key: string]: unknown;
}

interface ForumStoreState {
  // Data
  forums: Forum[];
  currentForum: Forum | null;
  boards: Board[];
  threads: Thread[];
  currentThread: Thread | null;
  posts: Thread[];
  comments: Comment[];
  searchResults: SearchResult[];
  searchQuery: string;

  // UI state
  loading: boolean;
  error: string | null;

  // ─── Forum actions ─────────────────────────────────────────────────
  fetchForums: () => Promise<void>;
  fetchForum: (id: string) => Promise<void>;
  clearCurrentForum: () => void;

  // ─── Board actions ─────────────────────────────────────────────────
  fetchBoards: (forumId: string) => Promise<void>;

  // ─── Thread / Post actions ─────────────────────────────────────────
  fetchThreads: (forumId: string) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  clearCurrentThread: () => void;

  // ─── Comment actions ───────────────────────────────────────────────
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // ─── Search ────────────────────────────────────────────────────────
  searchForums: (query: string, filters?: Record<string, unknown>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // ─── General ───────────────────────────────────────────────────────
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
   
  forums: [] as Forum[],
   
  currentForum: null as Forum | null,
   
  boards: [] as Board[],
   
  threads: [] as Thread[],
   
  currentThread: null as Thread | null,
   
  posts: [] as Thread[],
   
  comments: [] as Comment[],
   
  searchResults: [] as SearchResult[],
  searchQuery: '',
  loading: false,
   
  error: null as string | null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useForumStore = create<ForumStoreState>((set, _get) => ({
  ...initialState,

  // ─── Forum actions ───────────────────────────────────────────────────

  fetchForums: async () => {
    set({ loading: true, error: null });
    try {
      const res = await forumService.listForums();
      set({ forums: res.data?.data ?? res.data ?? [], loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch forums';
      set({ error: msg, loading: false });
    }
  },

  fetchForum: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await forumService.getForum(id);
      set({ currentForum: res.data?.data ?? res.data, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch forum';
      set({ error: msg, loading: false });
    }
  },

  clearCurrentForum: () => set({ currentForum: null, boards: [], threads: [] }),

  // ─── Board actions ───────────────────────────────────────────────────

  fetchBoards: async (forumId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await forumService.listBoards(forumId);
      set({ boards: res.data?.data ?? res.data ?? [], loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch boards';
      set({ error: msg, loading: false });
    }
  },

  // ─── Thread / Post actions ───────────────────────────────────────────

  fetchThreads: async (forumId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await forumService.listThreads(forumId);
      const data = res.data?.data ?? res.data ?? [];
      set({ threads: data, posts: data, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch threads';
      set({ error: msg, loading: false });
    }
  },

  fetchPost: async (postId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await forumService.getPost(postId);
      set({ currentThread: res.data?.data ?? res.data, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch post';
      set({ error: msg, loading: false });
    }
  },

  deletePost: async (postId: string) => {
    try {
      await forumService.deletePost(postId);
      set((state) => ({
        threads: state.threads.filter((t) => t.id !== postId),
        posts: state.posts.filter((p) => p.id !== postId),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete post';
      set({ error: msg });
      throw err;
    }
  },

  clearCurrentThread: () => set({ currentThread: null, comments: [] }),

  // ─── Comment actions ─────────────────────────────────────────────────

  fetchComments: async (postId: string) => {
    try {
      const res = await forumService.listComments(postId);
      set({ comments: res.data?.data ?? res.data ?? [] });
    } catch (err: unknown) {
      console.error('Error fetching comments:', err);
    }
  },

  addComment: async (postId: string, content: string, parentId?: string) => {
    try {
      const res = await forumService.createComment(postId, { content, parent_id: parentId });
      const newComment = res.data?.data ?? res.data;
      set((state) => ({ comments: [newComment, ...state.comments] }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add comment';
      set({ error: msg });
      throw err;
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      await forumService.deleteComment(commentId);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete comment';
      set({ error: msg });
      throw err;
    }
  },

  // ─── Search ──────────────────────────────────────────────────────────

  searchForums: async (query: string, filters?: Record<string, unknown>) => {
    set({ loading: true, error: null, searchQuery: query });
    try {
      const res = await forumService.searchForums(query, filters);
      set({ searchResults: res.data?.data ?? res.data ?? [], loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      set({ error: msg, loading: false });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  clearSearch: () => set({ searchResults: [], searchQuery: '' }),

  // ─── General ─────────────────────────────────────────────────────────

  reset: () => set(initialState),
}));

// ---------------------------------------------------------------------------
// Selector hooks (mirrors chatStore pattern)
// ---------------------------------------------------------------------------

export const useForums = () => useForumStore((s) => s.forums);
export const useCurrentForum = () => useForumStore((s) => s.currentForum);
export const useForumThreads = () => useForumStore((s) => s.threads);
export const useForumSearchResults = () => useForumStore((s) => s.searchResults);
export const useForumLoading = () => useForumStore((s) => s.loading);
export const useForumError = () => useForumStore((s) => s.error);

export default useForumStore;
