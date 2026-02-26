/**
 * Moderation Module Store Unit Tests
 *
 * Comprehensive tests for the Zustand moderation store.
 * Covers initial state, queue management, thread/post moderation,
 * bulk actions, user warnings, bans, warning types, and log actions.
 */

import { describe, it, expect, afterEach, vi, type MockedFunction } from 'vitest';
import { useModerationStore } from '@/modules/moderation/store';

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

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: vi.fn((data: Record<string, unknown>, key: string) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data[key])) return data[key];
    return [];
  }),
  ensureObject: vi.fn((data: Record<string, unknown>, key: string) => {
    if (!data) return {};
    if (key && data[key] && typeof data[key] === 'object') return data[key];
    return data;
  }),
  isRecord: vi.fn((v: unknown) => v != null && typeof v === 'object' && !Array.isArray(v)),
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
};

// ── Helpers ────────────────────────────────────────────────────────────

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

afterEach(() => {
  useModerationStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════

describe('moderationStore', () => {
  // ── 1. Initial state ─────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have correct default values', () => {
      const s = useModerationStore.getState();
      expect(s.queue).toEqual([]);
      expect(s.queueCounts).toEqual({ pending: 0, flagged: 0, reported: 0 });
      expect(s.isLoadingQueue).toBe(false);
      expect(s.warningTypes).toEqual([]);
      expect(s.currentUserWarnings).toEqual([]);
      expect(s.currentUserStats).toBeNull();
      expect(s.bans).toEqual([]);
      expect(s.isLoadingBans).toBe(false);
      expect(s.moderationLog).toEqual([]);
      expect(s.isLoadingLog).toBe(false);
      expect(s.bulkSelection).toEqual({ threads: [], posts: [], comments: [] });
    });

    it('should expose all expected action functions', () => {
      const s = useModerationStore.getState();
      expect(typeof s.fetchModerationQueue).toBe('function');
      expect(typeof s.approveQueueItem).toBe('function');
      expect(typeof s.rejectQueueItem).toBe('function');
      expect(typeof s.moveThread).toBe('function');
      expect(typeof s.closeThread).toBe('function');
      expect(typeof s.toggleBulkSelection).toBe('function');
      expect(typeof s.clearBulkSelection).toBe('function');
      expect(typeof s.banUser).toBe('function');
      expect(typeof s.liftBan).toBe('function');
      expect(typeof s.logModAction).toBe('function');
    });
  });

  // ── 2. fetchModerationQueue ──────────────────────────────────────────

  describe('fetchModerationQueue', () => {
    it('should set isLoadingQueue while fetching and clear it afterwards', async () => {
      mockedApi.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { items: [], counts: {} } }), 50)
          )
      );

      const promise = useModerationStore.getState().fetchModerationQueue();
      expect(useModerationStore.getState().isLoadingQueue).toBe(true);

      await promise;
      expect(useModerationStore.getState().isLoadingQueue).toBe(false);
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [], counts: {} } });

      await useModerationStore.getState().fetchModerationQueue();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/moderation/queue', {
        params: {},
      });
    });

    it('should pass filter params to the API', async () => {
      mockedApi.get.mockResolvedValue({ data: { items: [], counts: {} } });

      await useModerationStore.getState().fetchModerationQueue({
        status: 'pending',
        itemType: 'thread',
        priority: 'high',
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/admin/moderation/queue', {
        params: { status: 'pending', item_type: 'thread', priority: 'high' },
      });
    });

    it('should reset loading on error and rethrow', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchModerationQueue()).rejects.toThrow(
        'Network error'
      );
      expect(useModerationStore.getState().isLoadingQueue).toBe(false);
    });
  });

  // ── 3. approveQueueItem ──────────────────────────────────────────────

  describe('approveQueueItem', () => {
    it('should call the approve endpoint and update the queue item status', async () => {
      useModerationStore.setState({
        queue: [
          {
            id: 'q-1',
            itemType: 'thread',
            itemId: 'thread-1',
            authorId: 'u-1',
            authorUsername: 'alice',
            content: 'hello',
            contentPreview: 'hello',
            reason: 'flagged',
            status: 'pending',
            priority: 'normal',
            reportCount: 1,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        queueCounts: { pending: 1, flagged: 0, reported: 0 },
      });

      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().approveQueueItem('q-1', 'Looks good');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-1/approve', {
        notes: 'Looks good',
      });
      const s = useModerationStore.getState();
      expect(s.queue[0]!.status).toBe('approved');
      expect(s.queueCounts.pending).toBe(0);
    });

    it('should throw on API failure', async () => {
      mockedApi.post.mockRejectedValue(new Error('Server error'));

      await expect(useModerationStore.getState().approveQueueItem('q-1')).rejects.toThrow(
        'Server error'
      );
    });
  });

  // ── 4. rejectQueueItem ───────────────────────────────────────────────

  describe('rejectQueueItem', () => {
    it('should call the reject endpoint and update the queue item status', async () => {
      useModerationStore.setState({
        queue: [
          {
            id: 'q-2',
            itemType: 'post',
            itemId: 'post-99',
            authorId: 'u-2',
            authorUsername: 'bob',
            content: 'spam',
            contentPreview: 'spam',
            reason: 'auto_spam',
            status: 'pending',
            priority: 'high',
            reportCount: 5,
            createdAt: '2026-01-02T00:00:00Z',
          },
        ],
        queueCounts: { pending: 1, flagged: 0, reported: 0 },
      });

      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().rejectQueueItem('q-2', 'Spam detected', 'Auto-flagged');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/queue/q-2/reject', {
        reason: 'Spam detected',
        notes: 'Auto-flagged',
      });
      expect(useModerationStore.getState().queue[0]!.status).toBe('rejected');
    });
  });

  // ── 5. Thread moderation ─────────────────────────────────────────────

  describe('thread moderation', () => {
    it('moveThread should return success on API success', async () => {
      // logModAction is called internally, so mock the post endpoint for both calls
      mockedApi.post.mockResolvedValue({ data: { message: 'Moved!' } });

      const result = await useModerationStore.getState().moveThread('t-1', 'forum-2', true);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Moved!');
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/t-1/move', {
        target_forum_id: 'forum-2',
        leave_redirect: true,
      });
    });

    it('moveThread should return failure on API error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Forbidden'));

      const result = await useModerationStore.getState().moveThread('t-1', 'forum-2');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Forbidden');
    });

    it('closeThread should call the close endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().closeThread('t-5', 'Off-topic');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/t-5/close', {
        reason: 'Off-topic',
      });
    });

    it('closeThread should throw on API failure', async () => {
      mockedApi.post.mockRejectedValue(new Error('Not found'));

      await expect(useModerationStore.getState().closeThread('t-5')).rejects.toThrow('Not found');
    });
  });

  // ── 6. Post moderation ───────────────────────────────────────────────

  describe('post moderation', () => {
    it('softDeletePost should call the soft-delete endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().softDeletePost('p-1', 'Violation');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/posts/p-1/soft-delete', {
        reason: 'Violation',
      });
    });

    it('restorePost should call the restore endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().restorePost('p-2');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/posts/p-2/restore');
    });
  });

  // ── 7. Bulk selection ────────────────────────────────────────────────

  describe('bulk selection', () => {
    it('toggleBulkSelection should add an id', () => {
      useModerationStore.getState().toggleBulkSelection('threads', 't-1');

      expect(useModerationStore.getState().bulkSelection.threads).toEqual(['t-1']);
    });

    it('toggleBulkSelection should remove an id if already present', () => {
      useModerationStore.setState({
        bulkSelection: { threads: ['t-1', 't-2'], posts: [], comments: [] },
      });

      useModerationStore.getState().toggleBulkSelection('threads', 't-1');

      expect(useModerationStore.getState().bulkSelection.threads).toEqual(['t-2']);
    });

    it('clearBulkSelection should reset all selections', () => {
      useModerationStore.setState({
        bulkSelection: { threads: ['t-1'], posts: ['p-1'], comments: ['c-1'] },
      });

      useModerationStore.getState().clearBulkSelection();

      expect(useModerationStore.getState().bulkSelection).toEqual({
        threads: [],
        posts: [],
        comments: [],
      });
    });

    it('bulkMoveThreads should post selected thread IDs and clear selection', async () => {
      useModerationStore.setState({
        bulkSelection: { threads: ['t-1', 't-2'], posts: [], comments: [] },
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().bulkMoveThreads('forum-3');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/threads/bulk/move', {
        thread_ids: ['t-1', 't-2'],
        target_forum_id: 'forum-3',
      });
      expect(useModerationStore.getState().bulkSelection.threads).toEqual([]);
    });

    it('bulkDeleteThreads should not call API when selection is empty', async () => {
      await useModerationStore.getState().bulkDeleteThreads('cleanup');

      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  // ── 8. Bans ──────────────────────────────────────────────────────────

  describe('bans', () => {
    it('banUser should add the new ban to state', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          ban: {
            id: 'ban-1',
            banned_by_id: 'mod-1',
            banned_by_username: 'moderator',
            banned_at: '2026-02-08T00:00:00Z',
          },
        },
      });

      const result = await useModerationStore.getState().banUser({
        userId: 'u-bad',
        reason: 'Spam',
        expiresAt: null,
      });

      expect(result.id).toBe('ban-1');
      expect(result.reason).toBe('Spam');
      expect(useModerationStore.getState().bans).toHaveLength(1);
    });

    it('banUser should throw on API failure', async () => {
      mockedApi.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(useModerationStore.getState().banUser({ reason: 'test' })).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('liftBan should mark the ban as lifted', async () => {
      useModerationStore.setState({
        bans: [
          {
            id: 'ban-1',
            userId: 'u-1',
            username: 'baduser',
            email: null,
            ipAddress: null,
            reason: 'Spam',
            bannedById: 'mod-1',
            bannedByUsername: 'moderator',
            bannedAt: '2026-01-01T00:00:00Z',
            expiresAt: null,
            isActive: true,
            isLifted: false,
          },
        ],
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().liftBan('ban-1', 'Appeal accepted');

      const ban = useModerationStore.getState().bans[0]!;
      expect(ban.isActive).toBe(false);
      expect(ban.isLifted).toBe(true);
      expect(ban.liftReason).toBe('Appeal accepted');
    });
  });

  // ── 9. Warning types ─────────────────────────────────────────────────

  describe('warning types', () => {
    it('fetchWarningTypes should populate warningTypes', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          warning_types: [
            {
              id: 'wt-1',
              name: 'Spam',
              description: 'Posting spam content',
              points: 5,
              expiry_days: 30,
              action: 'moderate',
            },
          ],
        },
      });

      await useModerationStore.getState().fetchWarningTypes();

      const types = useModerationStore.getState().warningTypes;
      expect(types).toHaveLength(1);
      expect(types[0]!.name).toBe('Spam');
      expect(types[0]!.points).toBe(5);
    });

    it('fetchWarningTypes should throw on API failure', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await expect(useModerationStore.getState().fetchWarningTypes()).rejects.toThrow(
        'Server error'
      );
    });
  });

  // ── 10. User warnings ────────────────────────────────────────────────

  describe('user warnings', () => {
    it('issueWarning should add a warning to currentUserWarnings', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          warning: {
            id: 'w-1',
            username: 'troublemaker',
            warning_type_name: 'Spam',
            points: 5,
            issued_by_id: 'mod-1',
            issued_by_username: 'moderator',
            issued_at: '2026-02-08T00:00:00Z',
            expires_at: '2026-03-10T00:00:00Z',
          },
        },
      });

      const warning = await useModerationStore
        .getState()
        .issueWarning('u-1', 'wt-1', 'Spamming forums', 'Repeated offense');

      expect(warning.id).toBe('w-1');
      expect(warning.reason).toBe('Spamming forums');
      expect(useModerationStore.getState().currentUserWarnings).toHaveLength(1);
    });

    it('revokeWarning should mark the warning as revoked', async () => {
      useModerationStore.setState({
        currentUserWarnings: [
          {
            id: 'w-1',
            userId: 'u-1',
            username: 'user',
            warningTypeId: 'wt-1',
            warningTypeName: 'Spam',
            points: 5,
            reason: 'Test',
            issuedById: 'mod-1',
            issuedByUsername: 'mod',
            issuedAt: '2026-01-01T00:00:00Z',
            expiresAt: null,
            isActive: true,
            isRevoked: false,
          },
        ],
      });
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore.getState().revokeWarning('w-1', 'False positive');

      const w = useModerationStore.getState().currentUserWarnings[0]!;
      expect(w.isActive).toBe(false);
      expect(w.isRevoked).toBe(true);
      expect(w.revokeReason).toBe('False positive');
    });
  });

  // ── 11. Moderation log ───────────────────────────────────────────────

  describe('moderation log', () => {
    it('logModAction should post to the log endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useModerationStore
        .getState()
        .logModAction('ban_user', 'user', 'u-1', 'Spam', { duration: 'permanent' });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/admin/moderation/log', {
        action: 'ban_user',
        target_type: 'user',
        target_id: 'u-1',
        reason: 'Spam',
        details: { duration: 'permanent' },
      });
    });

    it('logModAction should not throw on API failure (silent fail)', async () => {
      mockedApi.post.mockRejectedValue(new Error('Log failed'));

      // Should not throw
      await useModerationStore.getState().logModAction('test_action', 'user', 'u-1');
    });

    it('fetchModerationLog should set isLoadingLog and populate entries', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          entries: [
            {
              id: 'log-1',
              action: 'ban_user',
              target_type: 'user',
              target_id: 'u-1',
              moderator_id: 'mod-1',
              moderator_username: 'moderator',
              created_at: '2026-02-08T00:00:00Z',
            },
          ],
        },
      });

      await useModerationStore.getState().fetchModerationLog();

      const s = useModerationStore.getState();
      expect(s.isLoadingLog).toBe(false);
      expect(s.moderationLog).toHaveLength(1);
      expect(s.moderationLog[0]!.action).toBe('ban_user');
    });

    it('fetchModerationLog should reset loading on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Timeout'));

      await expect(useModerationStore.getState().fetchModerationLog()).rejects.toThrow('Timeout');
      expect(useModerationStore.getState().isLoadingLog).toBe(false);
    });
  });

  // ── 12. Fetch bans ───────────────────────────────────────────────────

  describe('fetchBans', () => {
    it('should set isLoadingBans while fetching and clear afterwards', async () => {
      mockedApi.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { bans: [] } }), 50))
      );

      const promise = useModerationStore.getState().fetchBans();
      expect(useModerationStore.getState().isLoadingBans).toBe(true);

      await promise;
      expect(useModerationStore.getState().isLoadingBans).toBe(false);
    });

    it('should reset isLoadingBans on error and rethrow', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(useModerationStore.getState().fetchBans()).rejects.toThrow('Network error');
      expect(useModerationStore.getState().isLoadingBans).toBe(false);
    });
  });
});
