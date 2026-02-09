import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useForumHostingStore } from '../forumHostingStore.impl';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const { api } = await import('@/lib/api');
const mockedApi = vi.mocked(api);

const makeBoardApi = (overrides = {}) => ({
  id: 'b1',
  forum_id: 'f1',
  name: 'General',
  slug: 'general',
  description: 'desc',
  icon: null,
  position: 0,
  parent_board_id: null,
  is_locked: false,
  is_hidden: false,
  thread_count: 5,
  post_count: 10,
  last_post_at: null,
  last_post_title: null,
  last_post_author: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const makeThreadApi = (overrides = {}) => ({
  id: 't1',
  board_id: 'b1',
  author_id: 'u1',
  title: 'Thread 1',
  slug: 'thread-1',
  content: 'hello',
  content_html: '<p>hello</p>',
  thread_type: 'normal',
  is_locked: false,
  is_pinned: false,
  is_hidden: false,
  prefix: null,
  prefix_color: null,
  view_count: 0,
  reply_count: 0,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  last_post_at: null,
  last_reply_at: null,
  last_reply_by: null,
  author: null,
  last_poster: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const makePostApi = (overrides = {}) => ({
  id: 'p1',
  thread_id: 't1',
  author_id: 'u1',
  content: 'Post',
  content_html: '<p>Post</p>',
  is_edited: false,
  edit_count: 0,
  edit_reason: null,
  edited_at: null,
  is_hidden: false,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  position: 1,
  reply_to_id: null,
  author: null,
  inserted_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

const getInitialState = () => ({
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
  members: [],
  membersMeta: null,
  isLoadingMembers: false,
});

beforeEach(() => {
  useForumHostingStore.setState(getInitialState());
  vi.clearAllMocks();
});

// =============================================================================
// Initial State
// =============================================================================

describe('forumHostingStore initial state', () => {
  it('has empty boards', () => {
    expect(useForumHostingStore.getState().boards).toEqual([]);
  });
  it('has no current board', () => {
    expect(useForumHostingStore.getState().currentBoard).toBeNull();
  });
  it('has empty threads', () => {
    expect(useForumHostingStore.getState().threads).toEqual([]);
  });
  it('is not loading', () => {
    const s = useForumHostingStore.getState();
    expect(s.isLoadingBoards).toBe(false);
    expect(s.isLoadingThreads).toBe(false);
    expect(s.isLoadingPosts).toBe(false);
  });
});

// =============================================================================
// Board Actions
// =============================================================================

describe('fetchBoards', () => {
  it('fetches and maps boards', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [makeBoardApi()] } });
    await useForumHostingStore.getState().fetchBoards('f1');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
    expect(useForumHostingStore.getState().boards[0].name).toBe('General');
    expect(useForumHostingStore.getState().isLoadingBoards).toBe(false);
  });

  it('sets loading false on error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(useForumHostingStore.getState().fetchBoards('f1')).rejects.toThrow('fail');
    expect(useForumHostingStore.getState().isLoadingBoards).toBe(false);
  });
});

describe('fetchBoard', () => {
  it('fetches a single board', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: makeBoardApi({ id: 'b2' }) } });
    const board = await useForumHostingStore.getState().fetchBoard('b2');
    expect(board.id).toBe('b2');
    expect(useForumHostingStore.getState().currentBoard?.id).toBe('b2');
  });
});

describe('createBoard', () => {
  it('creates and appends a board', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: makeBoardApi({ id: 'b3' }) } });
    const board = await useForumHostingStore.getState().createBoard('f1', { name: 'New' });
    expect(board.id).toBe('b3');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
  });
});

describe('updateBoard', () => {
  it('updates a board in the list', async () => {
    useForumHostingStore.setState({ boards: [{ id: 'b1', name: 'Old' } as any] });
    mockedApi.put.mockResolvedValueOnce({ data: { data: makeBoardApi({ name: 'Updated' }) } });
    const board = await useForumHostingStore
      .getState()
      .updateBoard('f1', 'b1', { name: 'Updated' });
    expect(board.name).toBe('Updated');
    expect(useForumHostingStore.getState().boards[0].name).toBe('Updated');
  });
});

describe('deleteBoard', () => {
  it('removes a board from the list', async () => {
    useForumHostingStore.setState({ boards: [{ id: 'b1' } as any, { id: 'b2' } as any] });
    mockedApi.delete.mockResolvedValueOnce({});
    await useForumHostingStore.getState().deleteBoard('f1', 'b1');
    expect(useForumHostingStore.getState().boards).toHaveLength(1);
    expect(useForumHostingStore.getState().boards[0].id).toBe('b2');
  });
});

// =============================================================================
// Thread Actions
// =============================================================================

describe('fetchThreads', () => {
  it('fetches threads for a board', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [makeThreadApi()], meta: { page: 1, perPage: 20, total: 1 } },
    });
    await useForumHostingStore.getState().fetchThreads('b1');
    expect(useForumHostingStore.getState().threads).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingThreads).toBe(false);
  });
});

describe('createThread', () => {
  it('creates and prepends a thread', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: makeThreadApi({ id: 't2' }) } });
    const thread = await useForumHostingStore
      .getState()
      .createThread('b1', { title: 'New', content: 'body' });
    expect(thread.id).toBe('t2');
    expect(useForumHostingStore.getState().threads[0].id).toBe('t2');
  });
});

describe('deleteThread', () => {
  it('removes a thread from the list', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1' } as any] });
    mockedApi.delete.mockResolvedValueOnce({});
    await useForumHostingStore.getState().deleteThread('t1');
    expect(useForumHostingStore.getState().threads).toHaveLength(0);
  });
});

describe('pinThread', () => {
  it('pins a thread', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1', isPinned: false } as any] });
    mockedApi.post.mockResolvedValueOnce({});
    await useForumHostingStore.getState().pinThread('t1', true);
    expect(useForumHostingStore.getState().threads[0].isPinned).toBe(true);
  });
});

describe('lockThread', () => {
  it('locks a thread', async () => {
    useForumHostingStore.setState({ threads: [{ id: 't1', isLocked: false } as any] });
    mockedApi.post.mockResolvedValueOnce({});
    await useForumHostingStore.getState().lockThread('t1', true);
    expect(useForumHostingStore.getState().threads[0].isLocked).toBe(true);
  });
});

// =============================================================================
// Post Actions
// =============================================================================

describe('fetchPosts', () => {
  it('fetches posts for a thread', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [makePostApi()], meta: { page: 1, per_page: 20, total: 1 } },
    });
    await useForumHostingStore.getState().fetchPosts('t1');
    expect(useForumHostingStore.getState().posts).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingPosts).toBe(false);
  });
});

describe('createPost', () => {
  it('creates and appends a post', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: makePostApi({ id: 'p2' }) } });
    const post = await useForumHostingStore.getState().createPost('t1', { content: 'reply' });
    expect(post.id).toBe('p2');
    expect(useForumHostingStore.getState().posts).toHaveLength(1);
  });
});

describe('deletePost', () => {
  it('removes a post', async () => {
    useForumHostingStore.setState({ posts: [{ id: 'p1' } as any] });
    mockedApi.delete.mockResolvedValueOnce({});
    await useForumHostingStore.getState().deletePost('t1', 'p1');
    expect(useForumHostingStore.getState().posts).toHaveLength(0);
  });
});

// =============================================================================
// Member Actions
// =============================================================================

describe('fetchMembers', () => {
  it('fetches members for a forum', async () => {
    const member = {
      id: 'm1',
      forum_id: 'f1',
      user_id: 'u1',
      display_name: 'User',
      title: null,
      signature: null,
      avatar_url: null,
      post_count: 0,
      thread_count: 0,
      reputation: 0,
      role: 'member',
      is_banned: false,
      joined_at: null,
      last_visit_at: null,
    };
    mockedApi.get.mockResolvedValueOnce({
      data: { data: [member], meta: { page: 1, per_page: 20, total: 1 } },
    });
    await useForumHostingStore.getState().fetchMembers('f1');
    expect(useForumHostingStore.getState().members).toHaveLength(1);
    expect(useForumHostingStore.getState().isLoadingMembers).toBe(false);
  });

  it('sets loading false on error', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(useForumHostingStore.getState().fetchMembers('f1')).rejects.toThrow();
    expect(useForumHostingStore.getState().isLoadingMembers).toBe(false);
  });
});
