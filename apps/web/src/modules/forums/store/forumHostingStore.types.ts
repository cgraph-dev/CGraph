/**
 * Forum hosting store type definitions.
 * @module
 */
// =============================================================================
// Types - Boards, Threads, Posts (MyBB-style)
// =============================================================================

export interface Board {
  id: string;
  forumId: string;
  parentBoardId: string | null;
  parentId: string | null; // Alias for compatibility
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
  lastPostTitle: string | null;
  lastPostAuthor: string | null;
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
  lastReplyAt: string | null; // Alias
  lastReplyBy: string | null;
  author: ThreadAuthor | null;
  lastPoster: ThreadAuthor | null;
  createdAt: string;
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
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export interface Forum {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  memberCount?: number;
  threadCount?: number;
  postCount?: number;
  score?: number;
  isPublic?: boolean;
  createdAt?: string;
  ownerId?: string;
  userVote?: number | null;
  isSubscribed?: boolean;
}

export interface ForumMember {
  id: string;
  forumId: string;
  userId: string;
  displayName: string | null;
  title: string | null;
  signature: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  postCount: number;
  threadCount: number;
  reputation: number;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  isBanned: boolean;
  joinedAt: string | null;
  lastVisitAt: string | null;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  icon?: string;
  position?: number;
  parentBoardId?: string;
}

export interface CreateThreadData {
  title: string;
  content: string;
  prefix?: string;
}

export interface CreatePostData {
  content: string;
  replyToId?: string;
}

export interface UpdatePostData {
  content: string;
  editReason?: string;
}

export interface ThreadListOptions {
  page?: number;
  perPage?: number;
  sort?: 'latest' | 'hot' | 'top' | 'views';
}

export interface PostListOptions {
  page?: number;
  perPage?: number;
}

export interface MemberListOptions {
  page?: number;
  perPage?: number;
  sort?: 'recent' | 'reputation' | 'posts' | 'alphabetical';
  role?: 'member' | 'moderator' | 'admin' | 'owner';
  search?: string;
}

// =============================================================================
// Store State
// =============================================================================

export interface ForumHostingState {
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

  // Members
  members: ForumMember[];
  membersMeta: PaginationMeta | null;
  isLoadingMembers: boolean;

  // Actions - Boards
  fetchBoards: (forumId: string) => Promise<void>;
  fetchBoard: (boardId: string) => Promise<Board>;
  createBoard: (forumId: string, data: CreateBoardData) => Promise<Board>;
  updateBoard: (forumId: string, boardId: string, data: Partial<CreateBoardData>) => Promise<Board>;
  deleteBoard: (forumId: string, boardId: string) => Promise<void>;

  // Actions - Threads
  fetchThreads: (boardId: string, opts?: ThreadListOptions) => Promise<void>;
  fetchRecentThreads: (forumId: string, limit?: number) => Promise<void>;
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

  // Actions - Members
  fetchMembers: (forumId: string, opts?: MemberListOptions) => Promise<void>;
  reset: () => void;
}
