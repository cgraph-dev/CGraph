import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

// =============================================================================
// Types - Boards, Threads, Posts (MyBB-style)
// =============================================================================

export interface Board {
  id: string;
  forumId: string;
  parentBoardId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  position: number;
  isLocked: boolean;
  isHidden: boolean;
  threadCount: number;
  postCount: number;
  lastPostAt: string | null;
  insertedAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  slug: string;
  content: string | null;
  contentHtml: string | null;
  threadType: 'normal' | 'sticky' | 'announcement' | 'poll';
  isLocked: boolean;
  isPinned: boolean;
  isHidden: boolean;
  prefix: string | null;
  prefixColor: string | null;
  viewCount: number;
  replyCount: number;
  score: number;
  upvotes: number;
  downvotes: number;
  lastPostAt: string | null;
  author: ThreadAuthor | null;
  lastPoster: ThreadAuthor | null;
  insertedAt: string;
  updatedAt: string;
}

export interface ThreadPost {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  contentHtml: string | null;
  isEdited: boolean;
  editCount: number;
  editReason: string | null;
  editedAt: string | null;
  isHidden: boolean;
  score: number;
  upvotes: number;
  downvotes: number;
  position: number;
  replyToId: string | null;
  author: ThreadAuthor | null;
  insertedAt: string;
  updatedAt: string;
}

export interface ThreadAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface ForumMember {
  id: string;
  forumId: string;
  userId: string;
  displayName: string | null;
  title: string | null;
  signature: string | null;
  avatarUrl: string | null;
  postCount: number;
  threadCount: number;
  reputation: number;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  isBanned: boolean;
  joinedAt: string | null;
  lastVisitAt: string | null;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
}

// =============================================================================
// Store State
// =============================================================================

interface ForumHostingState {
  // Boards
  boards: Board[];
  currentBoard: Board | null;
  isLoadingBoards: boolean;

  // Threads
  threads: Thread[];
  currentThread: Thread | null;
  threadsMeta: PaginationMeta | null;
  isLoadingThreads: boolean;

  // Posts (replies)
  posts: ThreadPost[];
  postsMeta: PaginationMeta | null;
  isLoadingPosts: boolean;

  // Actions - Boards
  fetchBoards: (forumId: string) => Promise<void>;
  fetchBoard: (boardId: string) => Promise<Board>;
  createBoard: (forumId: string, data: CreateBoardData) => Promise<Board>;
  updateBoard: (forumId: string, boardId: string, data: Partial<CreateBoardData>) => Promise<Board>;
  deleteBoard: (forumId: string, boardId: string) => Promise<void>;

  // Actions - Threads
  fetchThreads: (boardId: string, opts?: ThreadListOptions) => Promise<void>;
  fetchThread: (threadId: string) => Promise<Thread>;
  createThread: (boardId: string, data: CreateThreadData) => Promise<Thread>;
  updateThread: (threadId: string, data: Partial<CreateThreadData>) => Promise<Thread>;
  deleteThread: (threadId: string) => Promise<void>;
  pinThread: (threadId: string, pinned: boolean) => Promise<void>;
  lockThread: (threadId: string, locked: boolean) => Promise<void>;
  voteThread: (threadId: string, value: 1 | -1) => Promise<void>;

  // Actions - Posts
  fetchPosts: (threadId: string, opts?: PostListOptions) => Promise<void>;
  createPost: (threadId: string, data: CreatePostData) => Promise<ThreadPost>;
  updatePost: (threadId: string, postId: string, data: UpdatePostData) => Promise<ThreadPost>;
  deletePost: (threadId: string, postId: string) => Promise<void>;
  votePost: (postId: string, value: 1 | -1) => Promise<void>;
}

interface CreateBoardData {
  name: string;
  description?: string;
  icon?: string;
  position?: number;
  parentBoardId?: string;
}

interface CreateThreadData {
  title: string;
  content: string;
  prefix?: string;
}

interface CreatePostData {
  content: string;
  replyToId?: string;
}

interface UpdatePostData {
  content: string;
  editReason?: string;
}

interface ThreadListOptions {
  page?: number;
  perPage?: number;
  sort?: 'latest' | 'hot' | 'top' | 'views';
}

interface PostListOptions {
  page?: number;
  perPage?: number;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useForumHostingStore = create<ForumHostingState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoadingBoards: false,

  threads: [],
  currentThread: null,
  threadsMeta: null,
  isLoadingThreads: false,

  posts: [],
  postsMeta: null,
  isLoadingPosts: false,

  // =========================================================================
  // Boards
  // =========================================================================

  fetchBoards: async (forumId: string) => {
    set({ isLoadingBoards: true });
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/boards`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBoards = ensureArray<any>(response.data, 'data');
      const boards = rawBoards.map(mapBoardFromApi);
      set({ boards, isLoadingBoards: false });
    } catch (error) {
      set({ isLoadingBoards: false });
      throw error;
    }
  },

  fetchBoard: async (boardId: string) => {
    const response = await api.get(`/api/v1/boards/${boardId}`);
    const board = mapBoardFromApi(response.data.data);
    set({ currentBoard: board });
    return board;
  },

  createBoard: async (forumId: string, data: CreateBoardData) => {
    const response = await api.post(`/api/v1/forums/${forumId}/boards`, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    const board = mapBoardFromApi(response.data.data);
    set((state) => ({ boards: [...state.boards, board] }));
    return board;
  },

  updateBoard: async (forumId: string, boardId: string, data: Partial<CreateBoardData>) => {
    const response = await api.put(`/api/v1/forums/${forumId}/boards/${boardId}`, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    const board = mapBoardFromApi(response.data.data);
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? board : b)),
    }));
    return board;
  },

  deleteBoard: async (forumId: string, boardId: string) => {
    await api.delete(`/api/v1/forums/${forumId}/boards/${boardId}`);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
    }));
  },

  // =========================================================================
  // Threads
  // =========================================================================

  fetchThreads: async (boardId: string, opts?: ThreadListOptions) => {
    set({ isLoadingThreads: true });
    try {
      const params = new URLSearchParams();
      if (opts?.page) params.set('page', String(opts.page));
      if (opts?.perPage) params.set('per_page', String(opts.perPage));
      if (opts?.sort) params.set('sort', opts.sort);

      const response = await api.get(`/api/v1/boards/${boardId}/threads?${params}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawThreads = ensureArray<any>(response.data, 'data');
      const threads = rawThreads.map(mapThreadFromApi);
      const meta = response.data.meta as PaginationMeta;

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
    set((state) => ({ threads: [thread, ...state.threads] }));
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
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, isPinned: pinned } : t
      ),
      currentThread:
        state.currentThread?.id === threadId
          ? { ...state.currentThread, isPinned: pinned }
          : state.currentThread,
    }));
  },

  lockThread: async (threadId: string, locked: boolean) => {
    await api.post(`/api/v1/threads/${threadId}/lock`, { locked });
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, isLocked: locked } : t
      ),
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

  // =========================================================================
  // Posts (Replies)
  // =========================================================================

  fetchPosts: async (threadId: string, opts?: PostListOptions) => {
    set({ isLoadingPosts: true });
    try {
      const params = new URLSearchParams();
      if (opts?.page) params.set('page', String(opts.page));
      if (opts?.perPage) params.set('per_page', String(opts.perPage));

      const response = await api.get(`/api/v1/threads/${threadId}/posts?${params}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawPosts = ensureArray<any>(response.data, 'data');
      const posts = rawPosts.map(mapPostFromApi);
      const meta = response.data.meta as PaginationMeta;

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
    set((state) => ({ posts: [...state.posts, post] }));
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
    await api.post(`/api/v1/posts/${postId}/vote`, { value });
    // Optimistic update would go here
  },
}));

// =============================================================================
// API Response Mappers
// =============================================================================

function mapBoardFromApi(data: Record<string, unknown>): Board {
  return {
    id: data.id as string,
    forumId: data.forum_id as string,
    parentBoardId: (data.parent_board_id as string) || null,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string) || null,
    icon: (data.icon as string) || null,
    position: (data.position as number) || 0,
    isLocked: (data.is_locked as boolean) || false,
    isHidden: (data.is_hidden as boolean) || false,
    threadCount: (data.thread_count as number) || 0,
    postCount: (data.post_count as number) || 0,
    lastPostAt: (data.last_post_at as string) || null,
    insertedAt: data.inserted_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapThreadFromApi(data: Record<string, unknown>): Thread {
  return {
    id: data.id as string,
    boardId: data.board_id as string,
    authorId: data.author_id as string,
    title: data.title as string,
    slug: data.slug as string,
    content: (data.content as string) || null,
    contentHtml: (data.content_html as string) || null,
    threadType: (data.thread_type as Thread['threadType']) || 'normal',
    isLocked: (data.is_locked as boolean) || false,
    isPinned: (data.is_pinned as boolean) || false,
    isHidden: (data.is_hidden as boolean) || false,
    prefix: (data.prefix as string) || null,
    prefixColor: (data.prefix_color as string) || null,
    viewCount: (data.view_count as number) || 0,
    replyCount: (data.reply_count as number) || 0,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    lastPostAt: (data.last_post_at as string) || null,
    author: data.author ? mapAuthorFromApi(data.author as Record<string, unknown>) : null,
    lastPoster: data.last_poster ? mapAuthorFromApi(data.last_poster as Record<string, unknown>) : null,
    insertedAt: data.inserted_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapPostFromApi(data: Record<string, unknown>): ThreadPost {
  return {
    id: data.id as string,
    threadId: data.thread_id as string,
    authorId: data.author_id as string,
    content: data.content as string,
    contentHtml: (data.content_html as string) || null,
    isEdited: (data.is_edited as boolean) || false,
    editCount: (data.edit_count as number) || 0,
    editReason: (data.edit_reason as string) || null,
    editedAt: (data.edited_at as string) || null,
    isHidden: (data.is_hidden as boolean) || false,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    position: (data.position as number) || 0,
    replyToId: (data.reply_to_id as string) || null,
    author: data.author ? mapAuthorFromApi(data.author as Record<string, unknown>) : null,
    insertedAt: data.inserted_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapAuthorFromApi(data: Record<string, unknown>): ThreadAuthor {
  return {
    id: data.id as string,
    username: data.username as string,
    avatarUrl: (data.avatar_url as string) || null,
  };
}
