/**
 * Forum Module Store Unit Tests
 *
 * Comprehensive tests for the Zustand forum store in the forums module.
 * Covers initial state, core CRUD, forum CRUD, moderation, features,
 * admin actions, and synchronous helpers.
 */

import { describe, it, expect, afterEach, vi, type MockedFunction } from 'vitest';
import { useForumStore } from '@/modules/forums/store';
import type { Forum, Post, Comment, ForumCategory } from '@/modules/forums/store';

// ── API mock ───────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ── Fixtures ───────────────────────────────────────────────────────────

const mockCategory: ForumCategory = {
  id: 'cat-1',
  name: 'General',
  slug: 'general',
  description: 'General discussion',
  color: '#3b82f6',
  order: 0,
  postCount: 42,
};

const mockForum: Forum = {
  id: 'forum-1',
  name: 'Test Forum',
  slug: 'test-forum',
  description: 'A test forum',
  iconUrl: 'https://example.com/icon.png',
  bannerUrl: 'https://example.com/banner.png',
  customCss: null,
  isNsfw: false,
  isPrivate: false,
  isPublic: true,
  memberCount: 150,
  threadCount: 50,
  postCount: 500,
  score: 100,
  upvotes: 120,
  downvotes: 20,
  hotScore: 85.5,
  weeklyScore: 200,
  featured: false,
  userVote: 0,
  categories: [mockCategory],
  moderators: [],
  isSubscribed: false,
  isMember: false,
  ownerId: 'user-123',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockForum2: Forum = {
  id: 'forum-2',
  name: 'Second Forum',
  slug: 'second-forum',
  description: 'Another forum',
  iconUrl: null,
  bannerUrl: null,
  customCss: null,
  isNsfw: false,
  isPrivate: true,
  isPublic: false,
  memberCount: 25,
  threadCount: 10,
  postCount: 100,
  score: 50,
  upvotes: 60,
  downvotes: 10,
  hotScore: 40.0,
  weeklyScore: 75,
  featured: true,
  userVote: 1,
  categories: [],
  moderators: [],
  isSubscribed: true,
  isMember: true,
  ownerId: 'user-456',
  createdAt: '2026-01-15T00:00:00Z',
};

const mockPost: Post = {
  id: 'post-1',
  forumId: 'forum-1',
  authorId: 'user-123',
  title: 'Test Post Title',
  content: 'This is the content of a test post.',
  postType: 'text',
  linkUrl: null,
  mediaUrls: [],
  isPinned: false,
  isLocked: false,
  isNsfw: false,
  upvotes: 10,
  downvotes: 2,
  score: 8,
  hotScore: 5.5,
  commentCount: 5,
  myVote: null,
  category: mockCategory,
  views: 100,
  author: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
  },
  forum: {
    id: 'forum-1',
    name: 'Test Forum',
    slug: 'test-forum',
    iconUrl: 'https://example.com/icon.png',
  },
  createdAt: '2026-01-30T10:00:00Z',
  updatedAt: '2026-01-30T10:00:00Z',
};

const mockPost2: Post = {
  id: 'post-2',
  forumId: 'forum-1',
  authorId: 'user-456',
  title: 'Second Test Post',
  content: 'Another test post content.',
  postType: 'link',
  linkUrl: 'https://example.com',
  mediaUrls: [],
  isPinned: true,
  isLocked: false,
  isNsfw: false,
  upvotes: 25,
  downvotes: 5,
  score: 20,
  hotScore: 15.0,
  commentCount: 12,
  myVote: 1,
  category: null,
  views: 500,
  author: {
    id: 'user-456',
    username: 'anotheruser',
    displayName: 'Another User',
    avatarUrl: null,
  },
  forum: {
    id: 'forum-1',
    name: 'Test Forum',
    slug: 'test-forum',
    iconUrl: null,
  },
  createdAt: '2026-01-29T15:00:00Z',
  updatedAt: '2026-01-30T08:00:00Z',
};

const mockComment: Comment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-456',
  parentId: null,
  content: 'This is a test comment.',
  upvotes: 5,
  downvotes: 1,
  score: 4,
  myVote: null,
  isCollapsed: false,
  depth: 0,
  children: [],
  author: {
    id: 'user-456',
    username: 'commenter',
    displayName: 'Commenter User',
    avatarUrl: 'https://example.com/avatar2.png',
  },
  createdAt: '2026-01-30T11:00:00Z',
  updatedAt: '2026-01-30T11:00:00Z',
};

const mockComment2: Comment = {
  id: 'comment-2',
  postId: 'post-1',
  authorId: 'user-123',
  parentId: 'comment-1',
  content: 'This is a reply comment.',
  upvotes: 2,
  downvotes: 0,
  score: 2,
  myVote: 1,
  isCollapsed: false,
  depth: 1,
  children: [],
  author: {
    id: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
  },
  createdAt: '2026-01-30T11:30:00Z',
  updatedAt: '2026-01-30T11:30:00Z',
};

// ── Helpers ────────────────────────────────────────────────────────────

const getInitialState = () => ({
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
  sortBy: 'hot' as const,
  timeRange: 'day' as const,
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  moderationQueue: [],
  reports: [],
  multiQuoteBuffer: [],
});

afterEach(() => {
  useForumStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════

describe('forumStore (module)', () => {
  // ── 1. Initial state ─────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have empty forums, posts, comments, and correct defaults', () => {
      const s = useForumStore.getState();
      expect(s.forums).toEqual([]);
      expect(s.posts).toEqual([]);
      expect(s.currentPost).toBeNull();
      expect(s.currentForum).toBeNull();
      expect(s.comments).toEqual({});
      expect(s.isLoadingForums).toBe(false);
      expect(s.isLoadingPosts).toBe(false);
      expect(s.isLoadingComments).toBe(false);
      expect(s.hasMorePosts).toBe(true);
      expect(s.sortBy).toBe('hot');
      expect(s.timeRange).toBe('day');
      expect(s.multiQuoteBuffer).toEqual([]);
      expect(s.threadPrefixes).toEqual([]);
      expect(s.subscriptions).toEqual([]);
      expect(s.userGroups).toEqual([]);
      expect(s.moderationQueue).toEqual([]);
      expect(s.reports).toEqual([]);
    });
  });

  // ── 2. fetchForums ───────────────────────────────────────────────────

  describe('fetchForums', () => {
    it('should set isLoadingForums while fetching and clear afterwards', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { forums: [] } }), 50))
      );

      const promise = useForumStore.getState().fetchForums();
      expect(useForumStore.getState().isLoadingForums).toBe(true);

      await promise;
      expect(useForumStore.getState().isLoadingForums).toBe(false);
    });

    it('should populate forums from API response', async () => {
      mockedApi.get.mockResolvedValue({ data: { forums: [mockForum, mockForum2] } });

      await useForumStore.getState().fetchForums();

      expect(useForumStore.getState().forums).toHaveLength(2);
    });

    it('should call the correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { forums: [] } });

      await useForumStore.getState().fetchForums();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums');
    });

    it('should reset loading on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useForumStore.getState().fetchForums()).rejects.toThrow('Network error');
      expect(useForumStore.getState().isLoadingForums).toBe(false);
    });
  });

  // ── 3. fetchForum (single) ──────────────────────────────────────────

  describe('fetchForum', () => {
    it('should set currentForum and add to forums list', async () => {
      mockedApi.get.mockResolvedValue({ data: { forum: mockForum } });

      const result = await useForumStore.getState().fetchForum('test-forum');

      expect(result.id).toBe('forum-1');
      expect(useForumStore.getState().currentForum).not.toBeNull();
      expect(useForumStore.getState().forums).toHaveLength(1);
    });

    it('should update an existing forum in the list instead of duplicating', async () => {
      useForumStore.setState({ forums: [mockForum] });
      const updated = { ...mockForum, name: 'Updated Name' };
      mockedApi.get.mockResolvedValue({ data: { forum: updated } });

      await useForumStore.getState().fetchForum('test-forum');

      expect(useForumStore.getState().forums).toHaveLength(1);
      expect(useForumStore.getState().forums[0]!.name).toBe('Updated Name');
    });

    it('should throw when forum not found', async () => {
      mockedApi.get.mockResolvedValue({ data: {} });

      await expect(useForumStore.getState().fetchForum('no-exist')).rejects.toThrow(
        'Forum not found'
      );
    });
  });

  // ── 4. fetchPosts ────────────────────────────────────────────────────

  describe('fetchPosts', () => {
    it('should call feed endpoint without a forumSlug', async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [] } });

      await useForumStore.getState().fetchPosts();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/posts/feed', {
        params: expect.objectContaining({ sort: 'hot', page: 1, limit: 25 }),
      });
    });

    it('should call forum-specific endpoint when forumSlug provided', async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [] } });

      await useForumStore.getState().fetchPosts('test-forum');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums/test-forum/posts', {
        params: expect.any(Object),
      });
    });

    it('should replace posts on page 1 and append on subsequent pages', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.get.mockResolvedValue({ data: { posts: [mockPost2] } });

      // page 1 → replace
      await useForumStore.getState().fetchPosts(undefined, 1);
      expect(useForumStore.getState().posts).toHaveLength(1);
      expect(useForumStore.getState().posts[0]!.id).toBe('post-2');

      // page 2 → append
      mockedApi.get.mockResolvedValue({ data: { posts: [mockPost] } });
      await useForumStore.getState().fetchPosts(undefined, 2);
      expect(useForumStore.getState().posts).toHaveLength(2);
    });

    it('should set hasMorePosts to false when fewer than 25 posts returned', async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [mockPost] } });

      await useForumStore.getState().fetchPosts();

      expect(useForumStore.getState().hasMorePosts).toBe(false);
    });

    it('should reset loading on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('fail'));

      await expect(useForumStore.getState().fetchPosts()).rejects.toThrow();
      expect(useForumStore.getState().isLoadingPosts).toBe(false);
    });
  });

  // ── 5. fetchPost (single post) ──────────────────────────────────────

  describe('fetchPost', () => {
    it('should set currentPost', async () => {
      mockedApi.get.mockResolvedValue({ data: { post: mockPost } });

      await useForumStore.getState().fetchPost('post-1');

      expect(useForumStore.getState().currentPost?.id).toBe('post-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/posts/post-1');
    });
  });

  // ── 6. fetchComments ─────────────────────────────────────────────────

  describe('fetchComments', () => {
    it('should store comments keyed by postId', async () => {
      mockedApi.get.mockResolvedValue({ data: { comments: [mockComment, mockComment2] } });

      await useForumStore.getState().fetchComments('post-1');

      expect(useForumStore.getState().comments['post-1']).toHaveLength(2);
    });

    it('should track isLoadingComments and clear on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('oops'));

      await expect(useForumStore.getState().fetchComments('post-1')).rejects.toThrow();
      expect(useForumStore.getState().isLoadingComments).toBe(false);
    });
  });

  // ── 7. createPost ───────────────────────────────────────────────────

  describe('createPost', () => {
    it('should create a post, return it, and prepend to posts', async () => {
      useForumStore.setState({ posts: [mockPost2] });
      mockedApi.post.mockResolvedValue({ data: { post: mockPost } });

      const result = await useForumStore.getState().createPost({
        forumId: 'forum-1',
        title: 'Test Post Title',
        content: 'Content',
        postType: 'text',
      });

      expect(result.id).toBe('post-1');
      expect(useForumStore.getState().posts).toHaveLength(2);
      expect(useForumStore.getState().posts[0]!.id).toBe('post-1');
    });

    it('should throw when API returns no post', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(
        useForumStore.getState().createPost({
          forumId: 'forum-1',
          title: 'Test',
          postType: 'text',
        })
      ).rejects.toThrow('Failed to create post');
    });
  });

  // ── 8. createComment ─────────────────────────────────────────────────

  describe('createComment', () => {
    it('should create a top-level comment and add to store', async () => {
      mockedApi.post.mockResolvedValue({ data: { comment: mockComment } });

      const result = await useForumStore.getState().createComment('post-1', 'Test comment');

      expect(result.id).toBe('comment-1');
      expect(useForumStore.getState().comments['post-1']).toHaveLength(1);
    });

    it('should pass parent_id for reply comments', async () => {
      mockedApi.post.mockResolvedValue({ data: { comment: mockComment2 } });

      await useForumStore.getState().createComment('post-1', 'Reply', 'comment-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/comments', {
        content: 'Reply',
        parent_id: 'comment-1',
      });
    });

    it('should throw when API returns no comment', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(useForumStore.getState().createComment('post-1', 'hi')).rejects.toThrow(
        'Failed to create comment'
      );
    });
  });

  // ── 9. vote (post / comment) ────────────────────────────────────────

  describe('vote', () => {
    it('should optimistically upvote a post', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', 1);

      const p = useForumStore.getState().posts[0]!;
      expect(p.myVote).toBe(1);
      expect(p.upvotes).toBe(11);
    });

    it('should optimistically downvote a post', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', -1);

      const p = useForumStore.getState().posts[0]!;
      expect(p.myVote).toBe(-1);
      expect(p.downvotes).toBe(3);
    });

    it('should call DELETE when removing vote (value null)', async () => {
      useForumStore.setState({ posts: [{ ...mockPost, myVote: 1, upvotes: 11 }] });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useForumStore.getState().vote('post', 'post-1', null);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/posts/post-1/vote');
    });

    it('should rollback on API error', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockRejectedValue(new Error('Vote failed'));

      await expect(useForumStore.getState().vote('post', 'post-1', 1)).rejects.toThrow();

      const p = useForumStore.getState().posts[0]!;
      expect(p.myVote).toBeNull();
      expect(p.upvotes).toBe(10);
    });

    it('should update currentPost when voting on the current post', async () => {
      useForumStore.setState({ posts: [mockPost], currentPost: mockPost });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().vote('post', 'post-1', 1);

      expect(useForumStore.getState().currentPost?.myVote).toBe(1);
    });

    it('should use the comment vote endpoint for comment votes', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().vote('comment', 'comment-1', 1);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/comments/comment-1/vote', { value: 1 });
    });
  });

  // ── 10. setSortBy / setTimeRange ─────────────────────────────────────

  describe('setSortBy / setTimeRange', () => {
    it('should change sortBy and reset posts', () => {
      useForumStore.setState({ posts: [mockPost], sortBy: 'hot' });

      useForumStore.getState().setSortBy('new');

      const s = useForumStore.getState();
      expect(s.sortBy).toBe('new');
      expect(s.posts).toHaveLength(0);
      expect(s.hasMorePosts).toBe(true);
    });

    it('should change timeRange and reset posts', () => {
      useForumStore.setState({ posts: [mockPost], timeRange: 'day' });

      useForumStore.getState().setTimeRange('week');

      expect(useForumStore.getState().timeRange).toBe('week');
      expect(useForumStore.getState().posts).toHaveLength(0);
    });
  });

  // ── 11. subscribe / unsubscribe ──────────────────────────────────────

  describe('subscribe / unsubscribe', () => {
    it('should subscribe to a forum and increment memberCount', async () => {
      useForumStore.setState({ forums: [mockForum] });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().subscribe('forum-1');

      const f = useForumStore.getState().forums[0]!;
      expect(f.isSubscribed).toBe(true);
      expect(f.memberCount).toBe(151);
    });

    it('should unsubscribe from a forum and decrement memberCount', async () => {
      useForumStore.setState({ forums: [{ ...mockForum, isSubscribed: true }] });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useForumStore.getState().unsubscribe('forum-1');

      const f = useForumStore.getState().forums[0]!;
      expect(f.isSubscribed).toBe(false);
      expect(f.memberCount).toBe(149);
    });
  });

  // ── 12. createForum / updateForum / deleteForum ─────────────────────

  describe('createForum', () => {
    it('should create a forum, add to state, and return it', async () => {
      mockedApi.post.mockResolvedValue({ data: { forum: mockForum } });

      const result = await useForumStore.getState().createForum({
        name: 'Test Forum',
        description: 'A test forum',
      });

      expect(result.id).toBe('forum-1');
      expect(useForumStore.getState().forums).toHaveLength(1);
    });

    it('should pass all options to API in snake_case', async () => {
      mockedApi.post.mockResolvedValue({ data: { forum: mockForum } });

      await useForumStore.getState().createForum({
        name: 'NSFW Forum',
        description: 'desc',
        isNsfw: true,
        isPrivate: true,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums', {
        name: 'NSFW Forum',
        description: 'desc',
        is_nsfw: true,
        is_private: true,
      });
    });

    it('should throw when no forum returned', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(useForumStore.getState().createForum({ name: 'X' })).rejects.toThrow(
        'Failed to create forum'
      );
    });
  });

  describe('updateForum', () => {
    it('should update the forum in the forums list', async () => {
      const updated = { ...mockForum, name: 'New Name' };
      mockedApi.put.mockResolvedValue({ data: { forum: updated } });
      useForumStore.setState({ forums: [mockForum] });

      const result = await useForumStore.getState().updateForum('forum-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(useForumStore.getState().forums).toHaveLength(1);
    });
  });

  describe('deleteForum', () => {
    it('should remove the forum from state', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useForumStore.setState({ forums: [mockForum, mockForum2] });

      await useForumStore.getState().deleteForum('forum-1');

      expect(useForumStore.getState().forums).toHaveLength(1);
      expect(useForumStore.getState().forums[0]!.id).toBe('forum-2');
    });
  });

  // ── 13. Moderation: pin / unpin / lock / unlock / deletePost ────────

  describe('moderation actions', () => {
    it('should pin a post and update state', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost] });

      await useForumStore.getState().pinPost('forum-1', 'post-1');

      expect(useForumStore.getState().posts[0]!.isPinned).toBe(true);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums/forum-1/posts/post-1/pin');
    });

    it('should unpin a post and update state', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [{ ...mockPost, isPinned: true }] });

      await useForumStore.getState().unpinPost('forum-1', 'post-1');

      expect(useForumStore.getState().posts[0]!.isPinned).toBe(false);
    });

    it('should lock a post and update state', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost] });

      await useForumStore.getState().lockPost('forum-1', 'post-1');

      expect(useForumStore.getState().posts[0]!.isLocked).toBe(true);
    });

    it('should unlock a post and update state', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [{ ...mockPost, isLocked: true }] });

      await useForumStore.getState().unlockPost('forum-1', 'post-1');

      expect(useForumStore.getState().posts[0]!.isLocked).toBe(false);
    });

    it('should delete a post, remove from state, and clear currentPost', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost, mockPost2], currentPost: mockPost });

      await useForumStore.getState().deletePost('forum-1', 'post-1');

      expect(useForumStore.getState().posts).toHaveLength(1);
      expect(useForumStore.getState().currentPost).toBeNull();
    });
  });

  // ── 14. Thread moderation (move / split / merge / close / reopen) ───

  describe('thread moderation', () => {
    it('should move a thread and remove from posts', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost] });

      await useForumStore.getState().moveThread('post-1', 'forum-2');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/move', {
        target_forum_id: 'forum-2',
      });
      expect(useForumStore.getState().posts).toHaveLength(0);
    });

    it('should split a thread', async () => {
      mockedApi.post.mockResolvedValue({ data: { new_thread_id: 'new-t' } });

      await useForumStore.getState().splitThread('post-1', ['p1', 'p2'], 'Split Title');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/split', {
        post_ids: ['p1', 'p2'],
        new_title: 'Split Title',
      });
    });

    it('should merge threads and remove source from posts', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost, mockPost2] });

      await useForumStore.getState().mergeThreads('post-1', 'post-2');

      expect(useForumStore.getState().posts).toHaveLength(1);
      expect(useForumStore.getState().posts[0]!.id).toBe('post-2');
    });

    it('should close a thread and mark as locked + closed', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [mockPost] });

      await useForumStore.getState().closeThread('post-1');

      const p = useForumStore.getState().posts[0]!;
      expect(p.isLocked).toBe(true);
      expect(p.isClosed).toBe(true);
    });

    it('should reopen a thread and clear locked + closed', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useForumStore.setState({ posts: [{ ...mockPost, isLocked: true, isClosed: true }] });

      await useForumStore.getState().reopenThread('post-1');

      const p = useForumStore.getState().posts[0]!;
      expect(p.isLocked).toBe(false);
      expect(p.isClosed).toBe(false);
    });
  });

  // ── 15. Multi-quote buffer ──────────────────────────────────────────

  describe('multiQuoteBuffer', () => {
    it('should add, not duplicate, remove, and clear posts', () => {
      const { addToMultiQuote, removeFromMultiQuote, clearMultiQuote } = useForumStore.getState();

      addToMultiQuote('post-1');
      addToMultiQuote('post-2');
      addToMultiQuote('post-1'); // duplicate — should be ignored
      expect(useForumStore.getState().multiQuoteBuffer).toEqual(['post-1', 'post-2']);

      removeFromMultiQuote('post-1');
      expect(useForumStore.getState().multiQuoteBuffer).toEqual(['post-2']);

      clearMultiQuote();
      expect(useForumStore.getState().multiQuoteBuffer).toEqual([]);
    });
  });

  // ── 16. fetchLeaderboard ────────────────────────────────────────────

  describe('fetchLeaderboard', () => {
    it('should fetch and store leaderboard + meta', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: [mockForum],
          meta: { page: 1, per_page: 25, total: 1, sort: 'hot' },
        },
      });

      await useForumStore.getState().fetchLeaderboard();

      expect(useForumStore.getState().leaderboard).toHaveLength(1);
      expect(useForumStore.getState().leaderboardMeta).toEqual({
        page: 1,
        perPage: 25,
        total: 1,
        sort: 'hot',
      });
    });

    it('should set isLoadingLeaderboard and clear on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('fail'));

      await expect(useForumStore.getState().fetchLeaderboard()).rejects.toThrow();
      expect(useForumStore.getState().isLoadingLeaderboard).toBe(false);
    });
  });

  // ── 17. fetchTopForums ──────────────────────────────────────────────

  describe('fetchTopForums', () => {
    it('should populate topForums', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [mockForum, mockForum2] } });

      await useForumStore.getState().fetchTopForums(10, 'hot');

      expect(useForumStore.getState().topForums).toHaveLength(2);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums/top', {
        params: { limit: 10, sort: 'hot' },
      });
    });
  });

  // ── 18. voteForum ───────────────────────────────────────────────────

  describe('voteForum', () => {
    it('should upvote a forum and update score in forums, leaderboard, topForums', async () => {
      const voteResult = {
        forum: { score: 101, upvotes: 121, downvotes: 20, user_vote: 1 },
      };
      mockedApi.post.mockResolvedValue({ data: voteResult });
      useForumStore.setState({
        forums: [mockForum],
        leaderboard: [mockForum],
        topForums: [mockForum],
      });

      await useForumStore.getState().voteForum('forum-1', 1);

      expect(useForumStore.getState().forums[0]!.score).toBe(101);
      expect(useForumStore.getState().leaderboard[0]!.score).toBe(101);
      expect(useForumStore.getState().topForums[0]!.score).toBe(101);
    });
  });

  // ── 19. Thread prefixes ─────────────────────────────────────────────

  describe('fetchThreadPrefixes', () => {
    it('should populate threadPrefixes with standard defaults', async () => {
      await useForumStore.getState().fetchThreadPrefixes();

      const prefixes = useForumStore.getState().threadPrefixes;
      expect(prefixes.length).toBeGreaterThanOrEqual(1);
      expect(prefixes.some((p) => p.id === 'discussion')).toBe(true);
    });
  });

  // ── 20. Admin: moderation queue ─────────────────────────────────────

  describe('moderation queue', () => {
    it('should fetch and store queue items', async () => {
      const item = {
        id: 'q-1',
        itemType: 'post',
        itemId: 'post-1',
        authorId: 'user-1',
        authorUsername: 'user',
        forumId: 'forum-1',
        forumName: 'Test',
        content: 'spam',
        reason: 'auto_spam',
        status: 'pending',
        createdAt: '2026-01-01T00:00:00Z',
      };
      mockedApi.get.mockResolvedValue({ data: { items: [item] } });

      await useForumStore.getState().fetchModerationQueue();

      expect(useForumStore.getState().moderationQueue).toHaveLength(1);
    });

    it('should approve an item and remove from queue', async () => {
      useForumStore.setState({
        moderationQueue: [
          {
            id: 'q-1',
            itemType: 'post',
            itemId: 'post-1',
            authorId: 'u',
            authorUsername: 'u',
            forumId: 'f',
            forumName: 'F',
            content: 'c',
            reason: 'manual',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().approveQueueItem('q-1');

      expect(useForumStore.getState().moderationQueue).toHaveLength(0);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-1/approve');
    });

    it('should reject an item with optional reason', async () => {
      useForumStore.setState({
        moderationQueue: [
          {
            id: 'q-2',
            itemType: 'comment',
            itemId: 'c-1',
            authorId: 'u',
            authorUsername: 'u',
            forumId: 'f',
            forumName: 'F',
            content: 'bad',
            reason: 'flagged',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().rejectQueueItem('q-2', 'spam content');

      expect(useForumStore.getState().moderationQueue).toHaveLength(0);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-2/reject', {
        reason: 'spam content',
      });
    });
  });

  // ── 21. Admin: user groups ──────────────────────────────────────────

  describe('user groups', () => {
    const mockGroup = {
      id: 'g-1',
      name: 'Moderators',
      type: 'custom' as const,
      isHidden: false,
      isSuperMod: false,
      canModerate: true,
      canAdmin: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissions: {} as any,
    };

    it('should fetch user groups', async () => {
      mockedApi.get.mockResolvedValue({ data: { user_groups: [mockGroup] } });

      await useForumStore.getState().fetchUserGroups();

      expect(useForumStore.getState().userGroups).toHaveLength(1);
    });

    it('should create a user group and add to state', async () => {
      mockedApi.post.mockResolvedValue({ data: { user_group: mockGroup } });

      const result = await useForumStore.getState().createUserGroup({
        name: 'Moderators',
        type: 'custom',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permissions: { canViewForum: true } as any,
      });

      expect(result.id).toBe('g-1');
      expect(useForumStore.getState().userGroups).toHaveLength(1);
    });

    it('should delete a user group from state', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useForumStore.setState({ userGroups: [mockGroup as any] });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useForumStore.getState().deleteUserGroup('g-1');

      expect(useForumStore.getState().userGroups).toHaveLength(0);
    });
  });

  // ── 22. Thread subscriptions ────────────────────────────────────────

  describe('thread subscriptions', () => {
    it('should subscribe to a thread and add to subscriptions', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useForumStore.getState().subscribeThread('post-1', 'email');

      const subs = useForumStore.getState().subscriptions;
      expect(subs).toHaveLength(1);
      expect(subs[0]!.entityId).toBe('post-1');
      expect(subs[0]!.notificationMode).toBe('email');
    });

    it('should unsubscribe from a thread and remove from subscriptions', async () => {
      useForumStore.setState({
        subscriptions: [
          {
            id: 'sub-post-1',
            userId: '',
            entityType: 'thread',
            entityId: 'post-1',
            notificationMode: 'email',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      });
      mockedApi.delete.mockResolvedValue({ data: {} });

      await useForumStore.getState().unsubscribeThread('post-1');

      expect(useForumStore.getState().subscriptions).toHaveLength(0);
    });

    it('should fetch subscriptions from API', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          subscriptions: [
            {
              id: 's-1',
              userId: 'u-1',
              entityType: 'thread',
              entityId: 'post-1',
              notificationMode: 'instant',
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        },
      });

      await useForumStore.getState().fetchSubscriptions();

      expect(useForumStore.getState().subscriptions).toHaveLength(1);
    });
  });

  // ── 23. Reports ─────────────────────────────────────────────────────

  describe('reports', () => {
    it('should submit a report and add to state', async () => {
      const mockReport = {
        id: 'r-1',
        reportType: 'post',
        itemId: 'post-1',
        reportedBy: 'user-1',
        reportedByUsername: 'user1',
        reason: 'spam',
        status: 'open',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockedApi.post.mockResolvedValue({ data: { report: mockReport } });

      const result = await useForumStore.getState().reportItem({
        reportType: 'post',
        itemId: 'post-1',
        reason: 'spam',
      });

      expect(result.id).toBe('r-1');
      expect(useForumStore.getState().reports).toHaveLength(1);
    });
  });

  // ── 24. Loading states isolation ────────────────────────────────────

  describe('loading states isolation', () => {
    it('should not affect other loading states when fetching forums', async () => {
      mockedApi.get.mockResolvedValue({ data: { forums: [] } });

      await useForumStore.getState().fetchForums();

      const s = useForumStore.getState();
      expect(s.isLoadingForums).toBe(false);
      expect(s.isLoadingPosts).toBe(false);
      expect(s.isLoadingComments).toBe(false);
      expect(s.isLoadingLeaderboard).toBe(false);
    });
  });
});
