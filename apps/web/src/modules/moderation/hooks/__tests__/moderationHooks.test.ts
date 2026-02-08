import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const mockModerationStore = vi.hoisted(() => ({
  // Thread actions
  closeThread: vi.fn().mockResolvedValue(undefined),
  reopenThread: vi.fn().mockResolvedValue(undefined),
  softDeleteThread: vi.fn().mockResolvedValue(undefined),
  restoreThread: vi.fn().mockResolvedValue(undefined),
  moveThread: vi.fn().mockResolvedValue({ success: true, threadId: 't1' }),
  splitThread: vi.fn().mockResolvedValue({ success: true, newThreadId: 't2' }),
  mergeThreads: vi.fn().mockResolvedValue({ success: true }),
  copyThread: vi.fn().mockResolvedValue({ success: true, newThreadId: 't3' }),
  approveThread: vi.fn().mockResolvedValue(undefined),
  unapproveThread: vi.fn().mockResolvedValue(undefined),

  // Post actions
  approvePost: vi.fn().mockResolvedValue(undefined),
  unapprovePost: vi.fn().mockResolvedValue(undefined),
  softDeletePost: vi.fn().mockResolvedValue(undefined),
  restorePost: vi.fn().mockResolvedValue(undefined),
  movePost: vi.fn().mockResolvedValue(undefined),

  // Queue
  queue: [] as Array<{
    id: string;
    itemType: string;
    status: string;
    priority: string;
  }>,
  queueCounts: { pending: 0, flagged: 0, reported: 0 },
  isLoadingQueue: false,
  fetchModerationQueue: vi.fn(),
  approveQueueItem: vi.fn().mockResolvedValue(undefined),
  rejectQueueItem: vi.fn().mockResolvedValue(undefined),

  // Warnings
  currentUserWarnings: [] as Array<{
    id: string;
    isActive: boolean;
    isRevoked: boolean;
    points: number;
  }>,
  currentUserStats: null,
  warningTypes: [] as Array<{ id: string; name: string }>,
  fetchUserWarnings: vi.fn(),
  fetchWarningTypes: vi.fn(),
  issueWarning: vi.fn().mockResolvedValue({ id: 'w1' }),
  revokeWarning: vi.fn().mockResolvedValue(undefined),

  // Bans
  bans: [] as Array<{
    id: string;
    isActive: boolean;
    isLifted: boolean;
    expiresAt: string | null;
  }>,
  isLoadingBans: false,
  fetchBans: vi.fn(),
  banUser: vi.fn().mockResolvedValue({ id: 'b1' }),
  liftBan: vi.fn().mockResolvedValue(undefined),

  // Moderation Log
  moderationLog: [] as Array<{
    id: string;
    action: string;
    moderatorId: string;
  }>,
  isLoadingLog: false,
  fetchModerationLog: vi.fn(),

  // Bulk
  bulkSelection: { threads: [] as string[], posts: [] as string[], comments: [] as string[] },
  toggleBulkSelection: vi.fn(),
  clearBulkSelection: vi.fn(),
  bulkMoveThreads: vi.fn().mockResolvedValue(undefined),
  bulkDeleteThreads: vi.fn().mockResolvedValue(undefined),
  bulkLockThreads: vi.fn().mockResolvedValue(undefined),
  bulkApproveThreads: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../store', () => ({
  useModerationStore: () => mockModerationStore,
}));

import { useThreadModeration, usePostModeration } from '../useModeration-actions';
import { useModerationQueue, useUserWarnings, useBanManagement } from '../useModeration-queue';
import { useInlineModeration } from '../useModeration-bulk';

// ─── useThreadModeration ─────────────────────────────────────────────────────

describe('useThreadModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lock calls closeThread with threadId and reason', async () => {
    const { result } = renderHook(() => useThreadModeration());
    await act(async () => {
      await result.current.lock('t1', 'Off-topic');
    });
    expect(mockModerationStore.closeThread).toHaveBeenCalledWith('t1', 'Off-topic');
  });

  it('unlock calls reopenThread', async () => {
    const { result } = renderHook(() => useThreadModeration());
    await act(async () => {
      await result.current.unlock('t1');
    });
    expect(mockModerationStore.reopenThread).toHaveBeenCalledWith('t1');
  });

  it('move calls moveThread and returns result', async () => {
    const { result } = renderHook(() => useThreadModeration());
    let moveResult: unknown;
    await act(async () => {
      moveResult = await result.current.move('t1', 'forum2', true);
    });
    expect(mockModerationStore.moveThread).toHaveBeenCalledWith('t1', 'forum2', true);
    expect(moveResult).toEqual({ success: true, threadId: 't1' });
  });

  it('split calls splitThread with all arguments', async () => {
    const { result } = renderHook(() => useThreadModeration());
    await act(async () => {
      await result.current.split('t1', ['p1', 'p2'], 'New Thread', 'forum3');
    });
    expect(mockModerationStore.splitThread).toHaveBeenCalledWith(
      't1',
      ['p1', 'p2'],
      'New Thread',
      'forum3'
    );
  });

  it('merge calls mergeThreads', async () => {
    const { result } = renderHook(() => useThreadModeration());
    await act(async () => {
      await result.current.merge('t1', 't2', true);
    });
    expect(mockModerationStore.mergeThreads).toHaveBeenCalledWith('t1', 't2', true);
  });
});

// ─── usePostModeration ───────────────────────────────────────────────────────

describe('usePostModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('approve calls approvePost', async () => {
    const { result } = renderHook(() => usePostModeration());
    await act(async () => {
      await result.current.approve('p1');
    });
    expect(mockModerationStore.approvePost).toHaveBeenCalledWith('p1');
  });

  it('delete calls softDeletePost with reason', async () => {
    const { result } = renderHook(() => usePostModeration());
    await act(async () => {
      await result.current.delete('p1', 'Violates rules');
    });
    expect(mockModerationStore.softDeletePost).toHaveBeenCalledWith('p1', 'Violates rules');
  });

  it('move calls movePost to target thread', async () => {
    const { result } = renderHook(() => usePostModeration());
    await act(async () => {
      await result.current.move('p1', 't5');
    });
    expect(mockModerationStore.movePost).toHaveBeenCalledWith('p1', 't5');
  });
});

// ─── useModerationQueue ──────────────────────────────────────────────────────

describe('useModerationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModerationStore.queue = [
      { id: 'q1', itemType: 'thread', status: 'pending', priority: 'critical' },
      { id: 'q2', itemType: 'post', status: 'pending', priority: 'normal' },
      { id: 'q3', itemType: 'comment', status: 'approved', priority: 'low' },
    ];
    mockModerationStore.queueCounts = { pending: 2, flagged: 0, reported: 1 };
  });

  it('returns the queue and counts', () => {
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.queue).toHaveLength(3);
    expect(result.current.pendingCount).toBe(2);
  });

  it('computes criticalCount from queue items', () => {
    const { result } = renderHook(() => useModerationQueue());
    expect(result.current.criticalCount).toBe(1);
  });

  it('approve calls approveQueueItem', async () => {
    const { result } = renderHook(() => useModerationQueue());
    await act(async () => {
      await result.current.approve('q1', 'Approved');
    });
    expect(mockModerationStore.approveQueueItem).toHaveBeenCalledWith('q1', 'Approved');
  });

  it('reject calls rejectQueueItem with reason', async () => {
    const { result } = renderHook(() => useModerationQueue());
    await act(async () => {
      await result.current.reject('q2', 'spam', 'obvious spam');
    });
    expect(mockModerationStore.rejectQueueItem).toHaveBeenCalledWith('q2', 'spam', 'obvious spam');
  });
});

// ─── useUserWarnings ─────────────────────────────────────────────────────────

describe('useUserWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModerationStore.currentUserWarnings = [
      { id: 'w1', isActive: true, isRevoked: false, points: 5 },
      { id: 'w2', isActive: true, isRevoked: false, points: 3 },
      { id: 'w3', isActive: false, isRevoked: true, points: 2 },
    ];
    mockModerationStore.warningTypes = [{ id: 'wt1', name: 'Spam' }];
  });

  it('computes activeWarnings filtering out revoked', () => {
    const { result } = renderHook(() => useUserWarnings('user1'));
    expect(result.current.activeWarnings).toHaveLength(2);
  });

  it('computes totalPoints from active warnings', () => {
    const { result } = renderHook(() => useUserWarnings('user1'));
    expect(result.current.totalPoints).toBe(8);
  });

  it('issue calls issueWarning', async () => {
    const { result } = renderHook(() => useUserWarnings('user1'));
    await act(async () => {
      await result.current.issue('user2', 'wt1', 'Repeated spam', 'First offense');
    });
    expect(mockModerationStore.issueWarning).toHaveBeenCalledWith(
      'user2',
      'wt1',
      'Repeated spam',
      'First offense'
    );
  });

  it('fetches warnings for the given userId on mount', () => {
    renderHook(() => useUserWarnings('user1'));
    expect(mockModerationStore.fetchUserWarnings).toHaveBeenCalledWith('user1');
  });
});

// ─── useBanManagement ────────────────────────────────────────────────────────

describe('useBanManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModerationStore.bans = [
      { id: 'b1', isActive: true, isLifted: false, expiresAt: null },
      { id: 'b2', isActive: true, isLifted: false, expiresAt: '2026-03-01' },
      { id: 'b3', isActive: false, isLifted: true, expiresAt: null },
    ];
  });

  it('computes activeBans correctly', () => {
    const { result } = renderHook(() => useBanManagement());
    expect(result.current.activeBans).toHaveLength(2);
  });

  it('separates permanent and temporary bans', () => {
    const { result } = renderHook(() => useBanManagement());
    expect(result.current.permanentBans).toHaveLength(1);
    expect(result.current.temporaryBans).toHaveLength(1);
  });

  it('ban calls banUser with data', async () => {
    const { result } = renderHook(() => useBanManagement());
    const banData = { userId: 'u1', reason: 'Abuse' };
    await act(async () => {
      await result.current.ban(banData);
    });
    expect(mockModerationStore.banUser).toHaveBeenCalledWith(banData);
  });

  it('lift calls liftBan with id and reason', async () => {
    const { result } = renderHook(() => useBanManagement());
    await act(async () => {
      await result.current.lift('b2', 'Appealed successfully');
    });
    expect(mockModerationStore.liftBan).toHaveBeenCalledWith('b2', 'Appealed successfully');
  });
});

// ─── useInlineModeration ─────────────────────────────────────────────────────

describe('useInlineModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModerationStore.bulkSelection = { threads: ['t1', 't2'], posts: [], comments: [] };
  });

  it('returns correct selection counts', () => {
    const { result } = renderHook(() => useInlineModeration());
    expect(result.current.selectedThreadCount).toBe(2);
    expect(result.current.selectedPostCount).toBe(0);
    expect(result.current.hasSelection).toBe(true);
  });

  it('isSelected checks if item is in selection', () => {
    const { result } = renderHook(() => useInlineModeration());
    expect(result.current.isSelected('threads', 't1')).toBe(true);
    expect(result.current.isSelected('threads', 't999')).toBe(false);
  });

  it('toggle calls toggleBulkSelection', () => {
    const { result } = renderHook(() => useInlineModeration());
    act(() => {
      result.current.toggle('posts', 'p1');
    });
    expect(mockModerationStore.toggleBulkSelection).toHaveBeenCalledWith('posts', 'p1');
  });

  it('moveSelectedThreads calls bulkMoveThreads', async () => {
    const { result } = renderHook(() => useInlineModeration());
    await act(async () => {
      await result.current.moveSelectedThreads('forum5');
    });
    expect(mockModerationStore.bulkMoveThreads).toHaveBeenCalledWith('forum5');
  });

  it('hasSelection is false when nothing is selected', () => {
    mockModerationStore.bulkSelection = { threads: [], posts: [], comments: [] };
    const { result } = renderHook(() => useInlineModeration());
    expect(result.current.hasSelection).toBe(false);
  });
});
