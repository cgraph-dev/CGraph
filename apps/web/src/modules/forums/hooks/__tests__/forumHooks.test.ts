import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const {
  mockConnect,
  mockJoinForum,
  mockLeaveForum,
  mockSubscribeToForum,
  mockUnsubscribeFromForum,
  mockJoinThread,
  mockLeaveThread,
  mockVoteOnThread,
  mockVoteOnComment,
  mockSendComment,
  mockSendThreadTyping,
  mockVoteOnPoll,
} = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockJoinForum: vi.fn(),
  mockLeaveForum: vi.fn(),
  mockSubscribeToForum: vi.fn().mockResolvedValue(undefined),
  mockUnsubscribeFromForum: vi.fn().mockResolvedValue(undefined),
  mockJoinThread: vi.fn(),
  mockLeaveThread: vi.fn(),
  mockVoteOnThread: vi.fn(),
  mockVoteOnComment: vi.fn(),
  mockSendComment: vi.fn(),
  mockSendThreadTyping: vi.fn(),
  mockVoteOnPoll: vi.fn(),
}));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    connect: mockConnect,
    joinForum: mockJoinForum,
    leaveForum: mockLeaveForum,
    subscribeToForum: mockSubscribeToForum,
    unsubscribeFromForum: mockUnsubscribeFromForum,
    joinThread: mockJoinThread,
    leaveThread: mockLeaveThread,
    voteOnThread: mockVoteOnThread,
    voteOnComment: mockVoteOnComment,
    sendComment: mockSendComment,
    sendThreadTyping: mockSendThreadTyping,
    voteOnPoll: mockVoteOnPoll,
  },
  ForumPresenceMember: {},
  ForumStatsPayload: {},
  ForumThreadPayload: {},
  ForumUserPayload: {},
  ThreadCommentPayload: {},
  ThreadVotePayload: {},
  CommentVotePayload: {},
  ThreadTypingPayload: {},
  ThreadPollPayload: {},
  ThreadPollData: {},
  ThreadViewerPayload: {},
}));

import { useForumSocket } from '../useForumSocket';
import { useThreadSocket } from '../useThreadSocket';

// ─── useForumSocket ──────────────────────────────────────────────────────────

describe('useForumSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJoinForum.mockReturnValue({ on: vi.fn() });
  });

  it('returns default state when forumId is undefined', () => {
    const { result } = renderHook(() => useForumSocket(undefined));

    expect(result.current.onlineMembers).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('connects to the socket and joins the forum channel when forumId is provided', async () => {
    const { result: _result } = renderHook(() => useForumSocket('forum-1'));

    // Wait for the async connect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(mockJoinForum).toHaveBeenCalledWith('forum-1', expect.any(Object));
  });

  it('sets isConnected to true when channel join succeeds', async () => {
    mockJoinForum.mockReturnValue({ on: vi.fn() }); // truthy channel

    const { result } = renderHook(() => useForumSocket('forum-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('leaves the forum channel on unmount', async () => {
    const { unmount } = renderHook(() => useForumSocket('forum-1'));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    expect(mockLeaveForum).toHaveBeenCalledWith('forum-1');
  });

  it('resets state when forumId changes to undefined', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useForumSocket(id),
      { initialProps: { id: 'forum-1' as string | undefined } }
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(true);

    rerender({ id: undefined });

    expect(result.current.onlineMembers).toEqual([]);
    expect(result.current.stats).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('subscribe calls socketManager.subscribeToForum', async () => {
    const { result } = renderHook(() => useForumSocket('forum-1'));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeToForum).toHaveBeenCalledWith('forum-1');
  });

  it('unsubscribe calls socketManager.unsubscribeFromForum', async () => {
    const { result } = renderHook(() => useForumSocket('forum-1'));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockUnsubscribeFromForum).toHaveBeenCalledWith('forum-1');
  });

  it('subscribe is a no-op when forumId is undefined', async () => {
    const { result } = renderHook(() => useForumSocket(undefined));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockSubscribeToForum).not.toHaveBeenCalled();
  });

  it('invokes onNewThread callback when the channel fires the event', async () => {
    const onNewThread = vi.fn();
    let capturedCallbacks: Record<string, Function> = {};

    mockJoinForum.mockImplementation((_id: string, cbs: Record<string, Function>) => {
      capturedCallbacks = cbs;
      return { on: vi.fn() };
    });

    renderHook(() => useForumSocket('forum-1', { onNewThread }));

    await act(async () => {
      await Promise.resolve();
    });

    const thread = { id: 't-1', title: 'New thread' };
    act(() => {
      capturedCallbacks.onNewThread?.(thread);
    });

    expect(onNewThread).toHaveBeenCalledWith(thread);
  });

  it('invokes onStatsUpdate callback and updates stats state', async () => {
    const onStatsUpdate = vi.fn();
    let capturedCallbacks: Record<string, Function> = {};

    mockJoinForum.mockImplementation((_id: string, cbs: Record<string, Function>) => {
      capturedCallbacks = cbs;
      return { on: vi.fn() };
    });

    const { result } = renderHook(() => useForumSocket('forum-1', { onStatsUpdate }));

    await act(async () => {
      await Promise.resolve();
    });

    const statsPayload = { threads: 10, members: 50, online: 5 };
    act(() => {
      capturedCallbacks.onStatsUpdate?.(statsPayload);
    });

    expect(onStatsUpdate).toHaveBeenCalledWith(statsPayload);
    expect(result.current.stats).toEqual(statsPayload);
  });
});

// ─── useThreadSocket ─────────────────────────────────────────────────────────

describe('useThreadSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJoinThread.mockReturnValue({ on: vi.fn() });
  });

  it('returns default state when threadId is undefined', () => {
    const { result } = renderHook(() => useThreadSocket(undefined));

    expect(result.current.viewers).toEqual([]);
    expect(result.current.typingUsers).toEqual([]);
    expect(result.current.votes).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('connects and joins the thread channel when threadId is provided', async () => {
    renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(mockJoinThread).toHaveBeenCalledWith('thread-1', expect.any(Object));
  });

  it('sets isConnected to true when channel is joined', async () => {
    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('leaves the thread channel on unmount', async () => {
    const { unmount } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    expect(mockLeaveThread).toHaveBeenCalledWith('thread-1');
  });

  it('vote calls socketManager.voteOnThread and updates votes state', async () => {
    const voteResult = { upvotes: 5, downvotes: 1, userVote: 1 };
    mockVoteOnThread.mockResolvedValue(voteResult);

    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let returnedVote;
    await act(async () => {
      returnedVote = await result.current.vote(1);
    });

    expect(mockVoteOnThread).toHaveBeenCalledWith('thread-1', 1);
    expect(returnedVote).toEqual(voteResult);
    expect(result.current.votes).toEqual(voteResult);
  });

  it('vote throws when threadId is undefined', async () => {
    const { result } = renderHook(() => useThreadSocket(undefined));

    await expect(result.current.vote(1)).rejects.toThrow('No thread ID');
  });

  it('postComment calls socketManager.sendComment', async () => {
    const commentResult = { comment_id: 'c-1' };
    mockSendComment.mockResolvedValue(commentResult);

    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let returned;
    await act(async () => {
      returned = await result.current.postComment('Hello!', 'parent-1');
    });

    expect(mockSendComment).toHaveBeenCalledWith('thread-1', 'Hello!', 'parent-1');
    expect(returned).toEqual(commentResult);
  });

  it('sendTyping calls socketManager.sendThreadTyping', async () => {
    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.sendTyping(true);
    });

    expect(mockSendThreadTyping).toHaveBeenCalledWith('thread-1', true);
  });

  it('sendTyping is a no-op when threadId is undefined', () => {
    const { result } = renderHook(() => useThreadSocket(undefined));

    act(() => {
      result.current.sendTyping(true);
    });

    expect(mockSendThreadTyping).not.toHaveBeenCalled();
  });

  it('votePoll calls socketManager.voteOnPoll', async () => {
    const pollResult = { poll: { id: 'p-1', options: [] } };
    mockVoteOnPoll.mockResolvedValue(pollResult);

    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let returned;
    await act(async () => {
      returned = await result.current.votePoll('opt-1');
    });

    expect(mockVoteOnPoll).toHaveBeenCalledWith('thread-1', 'opt-1');
    expect(returned).toEqual(pollResult);
  });

  it('voteComment calls socketManager.voteOnComment', async () => {
    const commentVoteResult = { upvotes: 3, downvotes: 0, userVote: 1 };
    mockVoteOnComment.mockResolvedValue(commentVoteResult);

    const { result } = renderHook(() => useThreadSocket('thread-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let returned;
    await act(async () => {
      returned = await result.current.voteComment('c-1', 1);
    });

    expect(mockVoteOnComment).toHaveBeenCalledWith('thread-1', 'c-1', 1);
    expect(returned).toEqual(commentVoteResult);
  });
});
