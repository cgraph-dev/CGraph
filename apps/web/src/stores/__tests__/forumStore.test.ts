/**
 * forumStore Unit Tests
 *
 * Tests for Zustand forum store state management.
 * These tests cover forums, posts, comments, voting,
 * subscriptions, and all async API operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { useForumStore } from '../forumStore';
import type { Forum, Post, Comment, ForumCategory } from '../forumStore';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api with proper typing
import { api } from '@/lib/api';

// Type the mocked API properly
const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock forum category
const mockCategory: ForumCategory = {
  id: 'cat-1',
  name: 'General',
  slug: 'general',
  description: 'General discussion',
  color: '#3b82f6',
  order: 0,
  postCount: 42,
};

// Mock forum
const mockForum: Forum = {
  id: 'forum-1',
  name: 'Test Forum',
  slug: 'test-forum',
  description: 'A test forum for testing',
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
  description: 'Another test forum',
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

// Mock post
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

// Mock comment
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

// Get initial state for reset
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

// Reset store state after each test
afterEach(() => {
  useForumStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('forumStore', () => {
  describe('initial state', () => {
    beforeEach(() => {
      useForumStore.setState(getInitialState());
    });

    it('should have empty forums initially', () => {
      const state = useForumStore.getState();
      expect(state.forums).toHaveLength(0);
    });

    it('should have empty posts initially', () => {
      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(0);
    });

    it('should have null currentPost initially', () => {
      const state = useForumStore.getState();
      expect(state.currentPost).toBeNull();
    });

    it('should have null currentForum initially', () => {
      const state = useForumStore.getState();
      expect(state.currentForum).toBeNull();
    });

    it('should have empty comments initially', () => {
      const state = useForumStore.getState();
      expect(state.comments).toEqual({});
    });

    it('should not be loading forums initially', () => {
      const state = useForumStore.getState();
      expect(state.isLoadingForums).toBe(false);
    });

    it('should not be loading posts initially', () => {
      const state = useForumStore.getState();
      expect(state.isLoadingPosts).toBe(false);
    });

    it('should have hasMorePosts true initially', () => {
      const state = useForumStore.getState();
      expect(state.hasMorePosts).toBe(true);
    });

    it('should have default sortBy as hot', () => {
      const state = useForumStore.getState();
      expect(state.sortBy).toBe('hot');
    });

    it('should have default timeRange as day', () => {
      const state = useForumStore.getState();
      expect(state.timeRange).toBe('day');
    });
  });

  describe('fetchForums action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { forums: [] } }), 100);
          })
      );

      const fetchPromise = useForumStore.getState().fetchForums();

      expect(useForumStore.getState().isLoadingForums).toBe(true);

      await fetchPromise;

      expect(useForumStore.getState().isLoadingForums).toBe(false);
    });

    it('should fetch and set forums data', async () => {
      mockedApi.get.mockResolvedValue({
        data: { forums: [mockForum, mockForum2] },
      });

      await useForumStore.getState().fetchForums();

      const state = useForumStore.getState();
      expect(state.forums).toHaveLength(2);
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { forums: [] } });

      await useForumStore.getState().fetchForums();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums');
    });

    it('should reset loading state on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useForumStore.getState().fetchForums()).rejects.toThrow('Network error');

      expect(useForumStore.getState().isLoadingForums).toBe(false);
    });
  });

  describe('fetchPosts action', () => {
    it('should set loading state while fetching posts', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { posts: [] } }), 100);
          })
      );

      const fetchPromise = useForumStore.getState().fetchPosts();

      expect(useForumStore.getState().isLoadingPosts).toBe(true);

      await fetchPromise;

      expect(useForumStore.getState().isLoadingPosts).toBe(false);
    });

    it('should fetch posts and set data', async () => {
      mockedApi.get.mockResolvedValue({
        data: { posts: [mockPost, mockPost2] },
      });

      await useForumStore.getState().fetchPosts();

      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(2);
    });

    it('should call feed endpoint when no forum slug provided', async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [] } });

      await useForumStore.getState().fetchPosts();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/posts/feed', {
        params: expect.objectContaining({ sort: 'hot', page: 1, limit: 25 }),
      });
    });

    it('should call forum posts endpoint when forum slug provided', async () => {
      mockedApi.get.mockResolvedValue({ data: { posts: [] } });

      await useForumStore.getState().fetchPosts('test-forum');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/forums/test-forum/posts', {
        params: expect.any(Object),
      });
    });

    it('should append posts when page > 1', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.get.mockResolvedValue({
        data: { posts: [mockPost2] },
      });

      await useForumStore.getState().fetchPosts(undefined, 2);

      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(2);
    });

    it('should replace posts when page is 1', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.get.mockResolvedValue({
        data: { posts: [mockPost2] },
      });

      await useForumStore.getState().fetchPosts(undefined, 1);

      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(1);
      expect(state.posts[0]!.id).toBe('post-2');
    });

    it('should set hasMorePosts to false when less than 25 posts returned', async () => {
      mockedApi.get.mockResolvedValue({
        data: { posts: [mockPost] },
      });

      await useForumStore.getState().fetchPosts();

      expect(useForumStore.getState().hasMorePosts).toBe(false);
    });

    it('should reset loading state on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Failed to fetch'));

      await expect(useForumStore.getState().fetchPosts()).rejects.toThrow();

      expect(useForumStore.getState().isLoadingPosts).toBe(false);
    });
  });

  describe('fetchPost action', () => {
    it('should fetch a single post and set as currentPost', async () => {
      mockedApi.get.mockResolvedValue({ data: { post: mockPost } });

      await useForumStore.getState().fetchPost('post-1');

      const state = useForumStore.getState();
      expect(state.currentPost).not.toBeNull();
      expect(state.currentPost?.id).toBe('post-1');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { post: mockPost } });

      await useForumStore.getState().fetchPost('post-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/posts/post-1');
    });
  });

  describe('createPost action', () => {
    it('should create a post and add to store', async () => {
      mockedApi.post.mockResolvedValue({ data: { post: mockPost } });

      const result = await useForumStore.getState().createPost({
        forumId: 'forum-1',
        title: 'Test Post Title',
        content: 'This is the content.',
        postType: 'text',
      });

      expect(result.id).toBe('post-1');
      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(1);
    });

    it('should call API with correct payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { post: mockPost } });

      await useForumStore.getState().createPost({
        forumId: 'forum-1',
        title: 'Test Post',
        content: 'Content here',
        postType: 'text',
        isNsfw: false,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts', {
        forum_id: 'forum-1',
        title: 'Test Post',
        content: 'Content here',
        post_type: 'text',
        link_url: undefined,
        media_urls: undefined,
        category_id: undefined,
        is_nsfw: false,
      });
    });

    it('should add new post to beginning of posts list', async () => {
      useForumStore.setState({ posts: [mockPost2] });
      mockedApi.post.mockResolvedValue({ data: { post: mockPost } });

      await useForumStore.getState().createPost({
        forumId: 'forum-1',
        title: 'Test',
        postType: 'text',
      });

      const state = useForumStore.getState();
      expect(state.posts).toHaveLength(2);
      expect(state.posts[0]!.id).toBe('post-1');
    });

    it('should throw error if post creation fails', async () => {
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

  describe('createComment action', () => {
    it('should create a comment and add to store', async () => {
      mockedApi.post.mockResolvedValue({ data: { comment: mockComment } });

      const result = await useForumStore.getState().createComment('post-1', 'Test comment');

      expect(result.id).toBe('comment-1');
      const state = useForumStore.getState();
      expect(state.comments['post-1']).toHaveLength(1);
    });

    it('should call API with correct endpoint and payload', async () => {
      mockedApi.post.mockResolvedValue({ data: { comment: mockComment } });

      await useForumStore.getState().createComment('post-1', 'Test comment');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/comments', {
        content: 'Test comment',
        parent_id: undefined,
      });
    });

    it('should include parent_id when replying to a comment', async () => {
      mockedApi.post.mockResolvedValue({ data: { comment: mockComment2 } });

      await useForumStore.getState().createComment('post-1', 'Reply comment', 'comment-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/comments', {
        content: 'Reply comment',
        parent_id: 'comment-1',
      });
    });

    it('should throw error if comment creation fails', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await expect(useForumStore.getState().createComment('post-1', 'Test')).rejects.toThrow(
        'Failed to create comment'
      );
    });
  });

  describe('upvotePost / downvotePost (vote action)', () => {
    it('should upvote a post and update state', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', 1);

      const state = useForumStore.getState();
      expect(state.posts[0]!.myVote).toBe(1);
      expect(state.posts[0]!.upvotes).toBe(11);
    });

    it('should downvote a post and update state', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', -1);

      const state = useForumStore.getState();
      expect(state.posts[0]!.myVote).toBe(-1);
      expect(state.posts[0]!.downvotes).toBe(3);
    });

    it('should remove vote when value is null', async () => {
      useForumStore.setState({ posts: [{ ...mockPost, myVote: 1, upvotes: 11 }] });
      mockedApi.delete.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', null);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/posts/post-1/vote');
    });

    it('should call correct endpoint for post vote', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', 1);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/posts/post-1/vote', { value: 1 });
    });

    it('should call correct endpoint for comment vote', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('comment', 'comment-1', 1);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/comments/comment-1/vote', { value: 1 });
    });

    it('should rollback on error', async () => {
      useForumStore.setState({ posts: [mockPost] });
      mockedApi.post.mockRejectedValue(new Error('Vote failed'));

      await expect(useForumStore.getState().vote('post', 'post-1', 1)).rejects.toThrow();

      const state = useForumStore.getState();
      expect(state.posts[0]!.myVote).toBeNull();
      expect(state.posts[0]!.upvotes).toBe(10);
    });

    it('should update currentPost when voting on current post', async () => {
      useForumStore.setState({ posts: [mockPost], currentPost: mockPost });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().vote('post', 'post-1', 1);

      const state = useForumStore.getState();
      expect(state.currentPost?.myVote).toBe(1);
    });
  });

  describe('subscribeToForum / unsubscribeFromForum actions', () => {
    it('should subscribe to a forum', async () => {
      useForumStore.setState({ forums: [mockForum] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().subscribe('forum-1');

      const state = useForumStore.getState();
      expect(state.forums[0]!.isSubscribed).toBe(true);
      expect(state.forums[0]!.memberCount).toBe(151);
    });

    it('should call subscribe API with correct endpoint', async () => {
      useForumStore.setState({ forums: [mockForum] });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().subscribe('forum-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/forums/forum-1/subscribe');
    });

    it('should unsubscribe from a forum', async () => {
      useForumStore.setState({ forums: [{ ...mockForum, isSubscribed: true }] });
      mockedApi.delete.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().unsubscribe('forum-1');

      const state = useForumStore.getState();
      expect(state.forums[0]!.isSubscribed).toBe(false);
      expect(state.forums[0]!.memberCount).toBe(149);
    });

    it('should call unsubscribe API with correct endpoint', async () => {
      useForumStore.setState({ forums: [mockForum] });
      mockedApi.delete.mockResolvedValue({ data: { success: true } });

      await useForumStore.getState().unsubscribe('forum-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/forums/forum-1/subscribe');
    });
  });

  describe('setCurrentForum / setCurrentPost (setSortBy / setTimeRange)', () => {
    it('should set sortBy and reset posts', () => {
      useForumStore.setState({ posts: [mockPost], sortBy: 'hot' });

      useForumStore.getState().setSortBy('new');

      const state = useForumStore.getState();
      expect(state.sortBy).toBe('new');
      expect(state.posts).toHaveLength(0);
      expect(state.hasMorePosts).toBe(true);
    });

    it('should set timeRange and reset posts', () => {
      useForumStore.setState({ posts: [mockPost], timeRange: 'day' });

      useForumStore.getState().setTimeRange('week');

      const state = useForumStore.getState();
      expect(state.timeRange).toBe('week');
      expect(state.posts).toHaveLength(0);
    });

    it('should allow setting sortBy to top', () => {
      useForumStore.getState().setSortBy('top');

      expect(useForumStore.getState().sortBy).toBe('top');
    });

    it('should allow setting sortBy to controversial', () => {
      useForumStore.getState().setSortBy('controversial');

      expect(useForumStore.getState().sortBy).toBe('controversial');
    });

    it('should allow setting timeRange to all', () => {
      useForumStore.getState().setTimeRange('all');

      expect(useForumStore.getState().timeRange).toBe('all');
    });
  });

  describe('loading states', () => {
    it('should track isLoadingForums correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(() => new Promise((resolve) => (resolvePromise = resolve)));

      const promise = useForumStore.getState().fetchForums();
      expect(useForumStore.getState().isLoadingForums).toBe(true);

      resolvePromise!({ data: { forums: [] } });
      await promise;

      expect(useForumStore.getState().isLoadingForums).toBe(false);
    });

    it('should track isLoadingPosts correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(() => new Promise((resolve) => (resolvePromise = resolve)));

      const promise = useForumStore.getState().fetchPosts();
      expect(useForumStore.getState().isLoadingPosts).toBe(true);

      resolvePromise!({ data: { posts: [] } });
      await promise;

      expect(useForumStore.getState().isLoadingPosts).toBe(false);
    });

    it('should track isLoadingComments correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(() => new Promise((resolve) => (resolvePromise = resolve)));

      const promise = useForumStore.getState().fetchComments('post-1');
      expect(useForumStore.getState().isLoadingComments).toBe(true);

      resolvePromise!({ data: { comments: [] } });
      await promise;

      expect(useForumStore.getState().isLoadingComments).toBe(false);
    });

    it('should not affect other loading states when fetching forums', async () => {
      mockedApi.get.mockResolvedValue({ data: { forums: [] } });

      await useForumStore.getState().fetchForums();

      const state = useForumStore.getState();
      expect(state.isLoadingPosts).toBe(false);
      expect(state.isLoadingComments).toBe(false);
    });
  });

  describe('fetchForum action', () => {
    it('should fetch a single forum and set as currentForum', async () => {
      mockedApi.get.mockResolvedValue({ data: { forum: mockForum } });

      const result = await useForumStore.getState().fetchForum('test-forum');

      expect(result.id).toBe('forum-1');
      const state = useForumStore.getState();
      expect(state.currentForum).not.toBeNull();
      expect(state.currentForum?.slug).toBe('test-forum');
    });

    it('should add forum to forums list if not present', async () => {
      mockedApi.get.mockResolvedValue({ data: { forum: mockForum } });

      await useForumStore.getState().fetchForum('test-forum');

      const state = useForumStore.getState();
      expect(state.forums).toHaveLength(1);
    });

    it('should update existing forum in forums list', async () => {
      useForumStore.setState({ forums: [mockForum] });
      const updatedForum = { ...mockForum, name: 'Updated Forum Name' };
      mockedApi.get.mockResolvedValue({ data: { forum: updatedForum } });

      await useForumStore.getState().fetchForum('test-forum');

      const state = useForumStore.getState();
      expect(state.forums).toHaveLength(1);
      expect(state.forums[0]!.name).toBe('Updated Forum Name');
    });

    it('should throw error if forum not found', async () => {
      mockedApi.get.mockResolvedValue({ data: {} });

      await expect(useForumStore.getState().fetchForum('nonexistent')).rejects.toThrow(
        'Forum not found'
      );
    });
  });

  describe('fetchComments action', () => {
    it('should fetch comments and store by postId', async () => {
      mockedApi.get.mockResolvedValue({
        data: { comments: [mockComment, mockComment2] },
      });

      await useForumStore.getState().fetchComments('post-1');

      const state = useForumStore.getState();
      expect(state.comments['post-1']).toHaveLength(2);
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { comments: [] } });

      await useForumStore.getState().fetchComments('post-1');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/posts/post-1/comments');
    });

    it('should reset loading state on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Failed to fetch'));

      await expect(useForumStore.getState().fetchComments('post-1')).rejects.toThrow();

      expect(useForumStore.getState().isLoadingComments).toBe(false);
    });
  });

  describe('multiQuoteBuffer actions', () => {
    it('should add post to multi-quote buffer', () => {
      useForumStore.getState().addToMultiQuote('post-1');

      const state = useForumStore.getState();
      expect(state.multiQuoteBuffer).toContain('post-1');
    });

    it('should remove post from multi-quote buffer', () => {
      useForumStore.setState({ multiQuoteBuffer: ['post-1', 'post-2'] });

      useForumStore.getState().removeFromMultiQuote('post-1');

      const state = useForumStore.getState();
      expect(state.multiQuoteBuffer).not.toContain('post-1');
      expect(state.multiQuoteBuffer).toContain('post-2');
    });

    it('should clear multi-quote buffer', () => {
      useForumStore.setState({ multiQuoteBuffer: ['post-1', 'post-2', 'post-3'] });

      useForumStore.getState().clearMultiQuote();

      const state = useForumStore.getState();
      expect(state.multiQuoteBuffer).toHaveLength(0);
    });
  });
});
