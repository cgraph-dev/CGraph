/**
 * moderationStore Unit Tests
 *
 * Tests for Zustand moderation store state management.
 * These tests cover moderation queue, warnings, bans,
 * bulk selection, and all async API operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useModerationStore } from '../moderationStore';
import type {
  ModerationQueueItem,
  UserWarning,
  Ban,
  ModerationLogEntry,
  WarningType,
  UserModerationStats,
} from '../moderationStore';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import the mocked api
import { api } from '@/lib/api';
const mockedApi = vi.mocked(api);

// Mock moderation queue items
const mockQueueItem: ModerationQueueItem = {
  id: 'queue-1',
  itemType: 'post',
  itemId: 'post-123',
  authorId: 'user-456',
  authorUsername: 'testuser',
  forumId: 'forum-1',
  forumName: 'General Discussion',
  title: 'Test Post Title',
  content: 'This is the full content of the post.',
  contentPreview: 'This is the full content...',
  reason: 'new_user',
  status: 'pending',
  priority: 'normal',
  reportCount: 0,
  createdAt: '2026-01-30T10:00:00Z',
};

const mockQueueItem2: ModerationQueueItem = {
  id: 'queue-2',
  itemType: 'thread',
  itemId: 'thread-789',
  authorId: 'user-789',
  authorUsername: 'spammer',
  forumId: 'forum-2',
  forumName: 'Off-Topic',
  title: 'Spam Thread',
  content: 'Spam content here.',
  contentPreview: 'Spam content...',
  reason: 'auto_spam',
  status: 'pending',
  priority: 'high',
  reportCount: 5,
  createdAt: '2026-01-30T11:00:00Z',
};

// Mock warning
const mockWarning: UserWarning = {
  id: 'warning-1',
  userId: 'user-456',
  username: 'testuser',
  warningTypeId: 'wtype-1',
  warningTypeName: 'Spam',
  points: 10,
  reason: 'Posted spam content',
  notes: 'First offense',
  issuedById: 'mod-1',
  issuedByUsername: 'moderator',
  issuedAt: '2026-01-30T12:00:00Z',
  expiresAt: '2026-04-30T12:00:00Z',
  isActive: true,
  isRevoked: false,
};

// Mock ban
const mockBan: Ban = {
  id: 'ban-1',
  userId: 'user-999',
  username: 'baduser',
  email: 'bad@example.com',
  ipAddress: '192.168.1.100',
  reason: 'Repeated violations',
  notes: 'Multiple warnings ignored',
  bannedById: 'mod-1',
  bannedByUsername: 'moderator',
  bannedAt: '2026-01-29T00:00:00Z',
  expiresAt: null, // Permanent
  isActive: true,
  isLifted: false,
};

// Mock moderation log entry
const mockLogEntry: ModerationLogEntry = {
  id: 'log-1',
  action: 'approve_post',
  targetType: 'post',
  targetId: 'post-123',
  targetTitle: 'Test Post',
  moderatorId: 'mod-1',
  moderatorUsername: 'moderator',
  reason: 'Content is appropriate',
  createdAt: '2026-01-30T10:30:00Z',
};

// Mock warning type
const mockWarningType: WarningType = {
  id: 'wtype-1',
  name: 'Spam',
  description: 'Posting spam or advertising',
  points: 10,
  expiryDays: 90,
  action: 'moderate',
  actionThreshold: 30,
};

// Mock user moderation stats
const mockUserStats: UserModerationStats = {
  userId: 'user-456',
  totalWarnings: 3,
  activeWarnings: 1,
  warningPoints: 10,
  isBanned: false,
  isSuspended: false,
  suspendedUntil: null,
  postCount: 150,
  reportedCount: 2,
  approvalRate: 98.5,
};

// Get initial state for reset
const getInitialState = () => ({
  queue: [],
  queueCounts: { pending: 0, flagged: 0, reported: 0 },
  isLoadingQueue: false,
  warningTypes: [],
  currentUserWarnings: [],
  currentUserStats: null,
  bans: [],
  isLoadingBans: false,
  moderationLog: [],
  isLoadingLog: false,
  bulkSelection: { threads: [], posts: [], comments: [] },
});

// Reset store state after each test
afterEach(() => {
  useModerationStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('moderationStore', () => {
  describe('initial state', () => {
    beforeEach(() => {
      useModerationStore.setState(getInitialState());
    });

    it('should have empty queue initially', () => {
      const state = useModerationStore.getState();
      expect(state.queue).toHaveLength(0);
    });

    it('should have zero queue counts initially', () => {
      const state = useModerationStore.getState();
      expect(state.queueCounts).toEqual({ pending: 0, flagged: 0, reported: 0 });
    });

    it('should not be loading queue initially', () => {
      const state = useModerationStore.getState();
      expect(state.isLoadingQueue).toBe(false);
    });

    it('should have empty warning types initially', () => {
      const state = useModerationStore.getState();
      expect(state.warningTypes).toHaveLength(0);
    });

    it('should have empty current user warnings initially', () => {
      const state = useModerationStore.getState();
      expect(state.currentUserWarnings).toHaveLength(0);
    });

    it('should have null current user stats initially', () => {
      const state = useModerationStore.getState();
      expect(state.currentUserStats).toBeNull();
    });

    it('should have empty bans list initially', () => {
      const state = useModerationStore.getState();
      expect(state.bans).toHaveLength(0);
    });

    it('should not be loading bans initially', () => {
      const state = useModerationStore.getState();
      expect(state.isLoadingBans).toBe(false);
    });

    it('should have empty moderation log initially', () => {
      const state = useModerationStore.getState();
      expect(state.moderationLog).toHaveLength(0);
    });

    it('should have empty bulk selection initially', () => {
      const state = useModerationStore.getState();
      expect(state.bulkSelection).toEqual({ threads: [], posts: [], comments: [] });
    });
  });

  describe('fetchQueue action', () => {
    it('should set loading state while fetching', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  data: { items: [], counts: { pending: 0, flagged: 0, reported: 0 } },
                }),
              100
            );
          })
      );

      const fetchPromise = useModerationStore.getState().fetchModerationQueue();

      expect(useModerationStore.getState().isLoadingQueue).toBe(true);

      await fetchPromise;

      expect(useModerationStore.getState().isLoadingQueue).toBe(false);
    });

    it('should fetch and set queue data', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          items: [
            {
              id: 'queue-1',
              item_type: 'post',
              item_id: 'post-123',
              author_id: 'user-456',
              author_username: 'testuser',
              forum_id: 'forum-1',
              forum_name: 'General Discussion',
              title: 'Test Post Title',
              content: 'This is the full content of the post.',
              content_preview: 'This is the full content...',
              reason: 'new_user',
              status: 'pending',
              priority: 'normal',
              report_count: 0,
              created_at: '2026-01-30T10:00:00Z',
            },
          ],
          counts: { pending: 1, flagged: 0, reported: 0 },
        },
      });

      await useModerationStore.getState().fetchModerationQueue();

      const state = useModerationStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].id).toBe('queue-1');
      expect(state.queue[0].itemType).toBe('post');
      expect(state.queue[0].status).toBe('pending');
    });

    it('should call API with correct filters', async () => {
      mockedApi.get.mockResolvedValue({
        data: { items: [], counts: { pending: 0, flagged: 0, reported: 0 } },
      });

      await useModerationStore.getState().fetchModerationQueue({
        status: 'pending',
        itemType: 'post',
        priority: 'high',
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/moderation/queue', {
        params: { status: 'pending', item_type: 'post', priority: 'high' },
      });
    });

    it('should update queue counts from response', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          items: [],
          counts: { pending: 5, flagged: 3, reported: 2 },
        },
      });

      await useModerationStore.getState().fetchModerationQueue();

      const state = useModerationStore.getState();
      expect(state.queueCounts).toEqual({ pending: 5, flagged: 3, reported: 2 });
    });

    it('should handle API errors gracefully', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchModerationQueue()).rejects.toThrow(
        'Network error'
      );

      const state = useModerationStore.getState();
      expect(state.isLoadingQueue).toBe(false);
    });
  });

  describe('approveQueueItem action', () => {
    beforeEach(() => {
      useModerationStore.setState({
        queue: [mockQueueItem, mockQueueItem2],
        queueCounts: { pending: 2, flagged: 0, reported: 0 },
      });
    });

    it('should update queue item status to approved', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().approveQueueItem('queue-1', 'Looks good');

      const state = useModerationStore.getState();
      const item = state.queue.find((q) => q.id === 'queue-1');
      expect(item?.status).toBe('approved');
    });

    it('should decrement pending count', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().approveQueueItem('queue-1');

      const state = useModerationStore.getState();
      expect(state.queueCounts.pending).toBe(1);
    });

    it('should call API with correct parameters', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().approveQueueItem('queue-1', 'Approved by mod');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/admin/moderation/queue/queue-1/approve',
        { notes: 'Approved by mod' }
      );
    });

    it('should not allow pending count to go below zero', async () => {
      useModerationStore.setState({ queueCounts: { pending: 0, flagged: 0, reported: 0 } });
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().approveQueueItem('queue-1');

      const state = useModerationStore.getState();
      expect(state.queueCounts.pending).toBe(0);
    });
  });

  describe('rejectQueueItem action', () => {
    beforeEach(() => {
      useModerationStore.setState({
        queue: [mockQueueItem, mockQueueItem2],
        queueCounts: { pending: 2, flagged: 0, reported: 0 },
      });
    });

    it('should update queue item status to rejected', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore
        .getState()
        .rejectQueueItem('queue-2', 'Spam content', 'Auto-detected');

      const state = useModerationStore.getState();
      const item = state.queue.find((q) => q.id === 'queue-2');
      expect(item?.status).toBe('rejected');
    });

    it('should call API with reason and notes', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore
        .getState()
        .rejectQueueItem('queue-2', 'Violates rules', 'See policy #5');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/queue-2/reject', {
        reason: 'Violates rules',
        notes: 'See policy #5',
      });
    });
  });

  describe('issueWarning action', () => {
    it('should add warning to current user warnings', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          warning: {
            id: 'warning-new',
            username: 'testuser',
            warning_type_name: 'Spam',
            points: 10,
            issued_by_id: 'mod-1',
            issued_by_username: 'moderator',
            issued_at: '2026-01-31T00:00:00Z',
            expires_at: '2026-04-30T00:00:00Z',
          },
        },
      });

      const result = await useModerationStore
        .getState()
        .issueWarning('user-456', 'wtype-1', 'Spam posting', 'First warning');

      expect(result.id).toBe('warning-new');
      expect(result.reason).toBe('Spam posting');
      expect(result.isActive).toBe(true);

      const state = useModerationStore.getState();
      expect(state.currentUserWarnings).toHaveLength(1);
      expect(state.currentUserWarnings[0].id).toBe('warning-new');
    });

    it('should call API with correct payload', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          warning: {
            id: 'warning-new',
            username: 'testuser',
            warning_type_name: 'Spam',
            points: 10,
            issued_by_id: 'mod-1',
            issued_by_username: 'moderator',
          },
        },
      });

      await useModerationStore
        .getState()
        .issueWarning('user-456', 'wtype-1', 'Spam posting', 'Notes here');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/users/user-456/warnings', {
        warning_type_id: 'wtype-1',
        reason: 'Spam posting',
        notes: 'Notes here',
      });
    });

    it('should handle API errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Permission denied'));

      await expect(
        useModerationStore.getState().issueWarning('user-456', 'wtype-1', 'Spam')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('banUser action', () => {
    it('should add ban to bans list', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          ban: {
            id: 'ban-new',
            banned_by_id: 'mod-1',
            banned_by_username: 'moderator',
            banned_at: '2026-01-31T00:00:00Z',
          },
        },
      });

      const result = await useModerationStore.getState().banUser({
        userId: 'user-999',
        username: 'baduser',
        reason: 'Repeated violations',
        expiresAt: null,
      });

      expect(result.id).toBe('ban-new');
      expect(result.isActive).toBe(true);
      expect(result.isLifted).toBe(false);

      const state = useModerationStore.getState();
      expect(state.bans).toHaveLength(1);
    });

    it('should handle permanent bans (no expiry)', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          ban: {
            id: 'ban-perm',
            banned_by_id: 'mod-1',
            banned_by_username: 'moderator',
          },
        },
      });

      const result = await useModerationStore.getState().banUser({
        userId: 'user-999',
        reason: 'Permanent ban',
        expiresAt: null,
      });

      expect(result.expiresAt).toBeNull();
    });

    it('should handle temporary bans with expiry', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          ban: {
            id: 'ban-temp',
            banned_by_id: 'mod-1',
            banned_by_username: 'moderator',
          },
        },
      });

      const result = await useModerationStore.getState().banUser({
        userId: 'user-999',
        reason: 'Temporary ban',
        expiresAt: '2026-02-15T00:00:00Z',
      });

      expect(result.expiresAt).toBe('2026-02-15T00:00:00Z');
    });

    it('should send correct API payload', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          ban: {
            id: 'ban-new',
            banned_by_id: 'mod-1',
            banned_by_username: 'moderator',
          },
        },
      });

      await useModerationStore.getState().banUser({
        userId: 'user-999',
        email: 'bad@example.com',
        ipAddress: '192.168.1.100',
        reason: 'Violations',
        notes: 'Multiple offenses',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/bans', {
        user_id: 'user-999',
        username: undefined,
        email: 'bad@example.com',
        ip_address: '192.168.1.100',
        reason: 'Violations',
        expires_at: undefined,
        notes: 'Multiple offenses',
      });
    });
  });

  describe('liftBan (unbanUser) action', () => {
    beforeEach(() => {
      useModerationStore.setState({
        bans: [mockBan],
      });
    });

    it('should update ban to lifted status', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().liftBan('ban-1', 'User appealed successfully');

      const state = useModerationStore.getState();
      const ban = state.bans.find((b) => b.id === 'ban-1');
      expect(ban?.isActive).toBe(false);
      expect(ban?.isLifted).toBe(true);
      expect(ban?.liftReason).toBe('User appealed successfully');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().liftBan('ban-1', 'Mistake');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/bans/ban-1/lift', {
        reason: 'Mistake',
      });
    });
  });

  describe('bulk selection state management', () => {
    it('should toggle thread selection on', () => {
      useModerationStore.getState().toggleBulkSelection('threads', 'thread-1');

      const state = useModerationStore.getState();
      expect(state.bulkSelection.threads).toContain('thread-1');
    });

    it('should toggle thread selection off when already selected', () => {
      useModerationStore.setState({
        bulkSelection: { threads: ['thread-1'], posts: [], comments: [] },
      });

      useModerationStore.getState().toggleBulkSelection('threads', 'thread-1');

      const state = useModerationStore.getState();
      expect(state.bulkSelection.threads).not.toContain('thread-1');
    });

    it('should toggle post selection independently', () => {
      useModerationStore.getState().toggleBulkSelection('posts', 'post-1');
      useModerationStore.getState().toggleBulkSelection('posts', 'post-2');

      const state = useModerationStore.getState();
      expect(state.bulkSelection.posts).toEqual(['post-1', 'post-2']);
    });

    it('should toggle comment selection', () => {
      useModerationStore.getState().toggleBulkSelection('comments', 'comment-1');

      const state = useModerationStore.getState();
      expect(state.bulkSelection.comments).toContain('comment-1');
    });

    it('should clear all bulk selections', () => {
      useModerationStore.setState({
        bulkSelection: {
          threads: ['thread-1', 'thread-2'],
          posts: ['post-1'],
          comments: ['comment-1'],
        },
      });

      useModerationStore.getState().clearBulkSelection();

      const state = useModerationStore.getState();
      expect(state.bulkSelection).toEqual({ threads: [], posts: [], comments: [] });
    });

    it('should maintain other selections when toggling one type', () => {
      useModerationStore.setState({
        bulkSelection: { threads: ['thread-1'], posts: ['post-1'], comments: [] },
      });

      useModerationStore.getState().toggleBulkSelection('threads', 'thread-2');

      const state = useModerationStore.getState();
      expect(state.bulkSelection.threads).toEqual(['thread-1', 'thread-2']);
      expect(state.bulkSelection.posts).toEqual(['post-1']);
    });
  });

  describe('queue counts tracking', () => {
    it('should calculate pending count from items if not in response', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          items: [
            {
              id: '1',
              status: 'pending',
              item_type: 'post',
              content: '',
              author_id: '',
              author_username: '',
            },
            {
              id: '2',
              status: 'pending',
              item_type: 'post',
              content: '',
              author_id: '',
              author_username: '',
            },
            {
              id: '3',
              status: 'approved',
              item_type: 'post',
              content: '',
              author_id: '',
              author_username: '',
            },
          ],
          counts: {},
        },
      });

      await useModerationStore.getState().fetchModerationQueue();

      const state = useModerationStore.getState();
      expect(state.queueCounts.pending).toBe(2);
    });

    it('should prefer counts from API response', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          items: [
            {
              id: '1',
              status: 'pending',
              item_type: 'post',
              content: '',
              author_id: '',
              author_username: '',
            },
          ],
          counts: { pending: 10, flagged: 5, reported: 3 },
        },
      });

      await useModerationStore.getState().fetchModerationQueue();

      const state = useModerationStore.getState();
      expect(state.queueCounts.pending).toBe(10);
      expect(state.queueCounts.flagged).toBe(5);
      expect(state.queueCounts.reported).toBe(3);
    });
  });

  describe('moderation log entries', () => {
    it('should fetch and set moderation log', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          entries: [
            {
              id: 'log-1',
              action: 'approve_post',
              target_type: 'post',
              target_id: 'post-123',
              target_title: 'Test Post',
              moderator_id: 'mod-1',
              moderator_username: 'moderator',
              reason: 'Content OK',
              created_at: '2026-01-30T10:30:00Z',
            },
          ],
        },
      });

      await useModerationStore.getState().fetchModerationLog();

      const state = useModerationStore.getState();
      expect(state.moderationLog).toHaveLength(1);
      expect(state.moderationLog[0].action).toBe('approve_post');
      expect(state.moderationLog[0].moderatorUsername).toBe('moderator');
    });

    it('should set loading state while fetching log', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { entries: [] } }), 100);
          })
      );

      const fetchPromise = useModerationStore.getState().fetchModerationLog();

      expect(useModerationStore.getState().isLoadingLog).toBe(true);

      await fetchPromise;

      expect(useModerationStore.getState().isLoadingLog).toBe(false);
    });

    it('should pass filters to API', async () => {
      mockedApi.get.mockResolvedValue({ data: { entries: [] } });

      await useModerationStore.getState().fetchModerationLog({
        moderatorId: 'mod-1',
        action: 'ban_user',
        targetType: 'user',
        page: 2,
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/moderation/log', {
        params: {
          moderator_id: 'mod-1',
          action: 'ban_user',
          target_type: 'user',
          page: 2,
        },
      });
    });

    it('should log mod action without throwing on failure', async () => {
      mockedApi.post.mockRejectedValue(new Error('Log failed'));

      // Should not throw
      await useModerationStore
        .getState()
        .logModAction('test_action', 'post', 'post-123', 'Test reason');

      expect(mockedApi.post).toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should track queue loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const fetchPromise = useModerationStore.getState().fetchModerationQueue();
      expect(useModerationStore.getState().isLoadingQueue).toBe(true);

      resolvePromise!({ data: { items: [], counts: {} } });
      await fetchPromise;

      expect(useModerationStore.getState().isLoadingQueue).toBe(false);
    });

    it('should track bans loading state', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const fetchPromise = useModerationStore.getState().fetchBans();
      expect(useModerationStore.getState().isLoadingBans).toBe(true);

      resolvePromise!({ data: { bans: [] } });
      await fetchPromise;

      expect(useModerationStore.getState().isLoadingBans).toBe(false);
    });

    it('should reset loading state on queue fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchModerationQueue()).rejects.toThrow();

      expect(useModerationStore.getState().isLoadingQueue).toBe(false);
    });

    it('should reset loading state on bans fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchBans()).rejects.toThrow();

      expect(useModerationStore.getState().isLoadingBans).toBe(false);
    });

    it('should reset loading state on log fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchModerationLog()).rejects.toThrow();

      expect(useModerationStore.getState().isLoadingLog).toBe(false);
    });
  });

  describe('revokeWarning action', () => {
    beforeEach(() => {
      useModerationStore.setState({
        currentUserWarnings: [mockWarning],
      });
    });

    it('should update warning to revoked status', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().revokeWarning('warning-1', 'Issued in error');

      const state = useModerationStore.getState();
      const warning = state.currentUserWarnings.find((w) => w.id === 'warning-1');
      expect(warning?.isActive).toBe(false);
      expect(warning?.isRevoked).toBe(true);
      expect(warning?.revokeReason).toBe('Issued in error');
    });

    it('should call API with correct endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().revokeWarning('warning-1', 'Wrong user');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/warnings/warning-1/revoke', {
        reason: 'Wrong user',
      });
    });
  });

  describe('fetchUserModerationStats action', () => {
    it('should fetch and set user moderation stats', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          total_warnings: 3,
          active_warnings: 1,
          warning_points: 10,
          is_banned: false,
          is_suspended: false,
          suspended_until: null,
          post_count: 150,
          reported_count: 2,
          approval_rate: 98.5,
        },
      });

      const result = await useModerationStore.getState().fetchUserModerationStats('user-456');

      expect(result.totalWarnings).toBe(3);
      expect(result.activeWarnings).toBe(1);
      expect(result.warningPoints).toBe(10);
      expect(result.approvalRate).toBe(98.5);

      const state = useModerationStore.getState();
      expect(state.currentUserStats).not.toBeNull();
      expect(state.currentUserStats?.userId).toBe('user-456');
    });
  });

  describe('fetchWarningTypes action', () => {
    it('should fetch and set warning types', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          warning_types: [
            {
              id: 'wtype-1',
              name: 'Spam',
              description: 'Posting spam',
              points: 10,
              expiry_days: 90,
              action: 'moderate',
              action_threshold: 30,
            },
            {
              id: 'wtype-2',
              name: 'Harassment',
              description: 'Harassing users',
              points: 25,
              expiry_days: 180,
              action: 'ban',
              action_threshold: 50,
            },
          ],
        },
      });

      await useModerationStore.getState().fetchWarningTypes();

      const state = useModerationStore.getState();
      expect(state.warningTypes).toHaveLength(2);
      expect(state.warningTypes[0].name).toBe('Spam');
      expect(state.warningTypes[1].points).toBe(25);
    });
  });

  describe('bulk moderation actions', () => {
    beforeEach(() => {
      useModerationStore.setState({
        bulkSelection: { threads: ['thread-1', 'thread-2'], posts: [], comments: [] },
      });
    });

    it('should bulk move threads and clear selection', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().bulkMoveThreads('forum-new');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/bulk/move', {
        thread_ids: ['thread-1', 'thread-2'],
        target_forum_id: 'forum-new',
      });

      const state = useModerationStore.getState();
      expect(state.bulkSelection.threads).toHaveLength(0);
    });

    it('should not call API if no threads selected for bulk move', async () => {
      useModerationStore.setState({
        bulkSelection: { threads: [], posts: [], comments: [] },
      });

      await useModerationStore.getState().bulkMoveThreads('forum-new');

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should bulk delete threads with reason', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().bulkDeleteThreads('Spam cleanup');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/bulk/delete', {
        thread_ids: ['thread-1', 'thread-2'],
        reason: 'Spam cleanup',
      });
    });

    it('should bulk lock threads', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().bulkLockThreads();

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/bulk/lock', {
        thread_ids: ['thread-1', 'thread-2'],
      });
    });

    it('should bulk approve threads', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await useModerationStore.getState().bulkApproveThreads();

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/bulk/approve', {
        thread_ids: ['thread-1', 'thread-2'],
      });
    });
  });

  describe('fetchBans action', () => {
    it('should fetch and set bans list', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          bans: [
            {
              id: 'ban-1',
              user_id: 'user-999',
              username: 'baduser',
              email: 'bad@example.com',
              ip_address: '192.168.1.100',
              reason: 'Violations',
              banned_by_id: 'mod-1',
              banned_by_username: 'moderator',
              banned_at: '2026-01-29T00:00:00Z',
              expires_at: null,
              is_active: true,
              is_lifted: false,
            },
          ],
        },
      });

      await useModerationStore.getState().fetchBans();

      const state = useModerationStore.getState();
      expect(state.bans).toHaveLength(1);
      expect(state.bans[0].username).toBe('baduser');
      expect(state.bans[0].isActive).toBe(true);
    });

    it('should pass active filter to API', async () => {
      mockedApi.get.mockResolvedValue({ data: { bans: [] } });

      await useModerationStore.getState().fetchBans({ active: true });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/bans', {
        params: { active: 'true' },
      });
    });
  });

  describe('fetchUserWarnings action', () => {
    it('should fetch and set user warnings', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          warnings: [
            {
              id: 'warning-1',
              user_id: 'user-456',
              username: 'testuser',
              warning_type_id: 'wtype-1',
              warning_type_name: 'Spam',
              points: 10,
              reason: 'Spam posting',
              issued_by_id: 'mod-1',
              issued_by_username: 'moderator',
              issued_at: '2026-01-30T12:00:00Z',
              expires_at: '2026-04-30T12:00:00Z',
              is_active: true,
              is_revoked: false,
            },
          ],
        },
      });

      const result = await useModerationStore.getState().fetchUserWarnings('user-456');

      expect(result).toHaveLength(1);
      expect(result[0].warningTypeName).toBe('Spam');

      const state = useModerationStore.getState();
      expect(state.currentUserWarnings).toHaveLength(1);
    });
  });
});
