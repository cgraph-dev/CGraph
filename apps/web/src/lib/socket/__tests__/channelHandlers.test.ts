/**
 * Tests for channelHandlers.ts
 *
 * Forum and thread Phoenix channel event handler wiring,
 * presence sync, and idempotent setup guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupForumHandlers, setupThreadHandlers } from '../channelHandlers';
import type { ForumChannelCallbacks, ThreadChannelCallbacks } from '../types';

// ---------------------------------------------------------------------------
// Mock Phoenix Presence
// ---------------------------------------------------------------------------
const { MockPresence } = vi.hoisted(() => {
  const MockPresence = vi.fn();
  MockPresence.prototype.onSync = vi.fn();
  MockPresence.prototype.list = vi.fn();
  return { MockPresence };
});

vi.mock('phoenix', () => ({
  Presence: MockPresence,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createMockChannel() {
  const handlers: Record<string, (payload: unknown) => void> = {};
  return {
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      handlers[event] = cb;
    }),
    _trigger(event: string, payload: unknown) {
      handlers[event]?.(payload);
    },
    _handlers: handlers,
  };
}

function makeMaps() {
  return {
    channels: new Map(),
    presences: new Map(),
    channelHandlersSetUp: new Set<string>(),
  };
}

// ---------------------------------------------------------------------------
// Forum Handlers
// ---------------------------------------------------------------------------
describe('setupForumHandlers', () => {
  let channel: ReturnType<typeof createMockChannel>;
  let maps: ReturnType<typeof makeMaps>;
  let forumCallbacks: Map<string, ForumChannelCallbacks>;

  beforeEach(() => {
    vi.clearAllMocks();
    channel = createMockChannel();
    maps = makeMaps();
    forumCallbacks = new Map();
  });

  it('registers handlers only once (idempotent guard)', () => {
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);
    const firstCallCount = channel.on.mock.calls.length;

    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);
    expect(channel.on.mock.calls.length).toBe(firstCallCount);
  });

  it('sets up Presence and stores it in maps', () => {
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);
    expect(MockPresence).toHaveBeenCalledWith(channel);
    expect(maps.presences.has('forum:f1')).toBe(true);
  });

  it('registers all forum events', () => {
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);
    const events = channel.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('new_thread');
    expect(events).toContain('thread_pinned');
    expect(events).toContain('thread_locked');
    expect(events).toContain('thread_deleted');
    expect(events).toContain('member_joined');
    expect(events).toContain('member_left');
    expect(events).toContain('stats_update');
    expect(events).toContain('forum_stats');
  });

  it('dispatches new_thread to callback', () => {
    const onNewThread = vi.fn();
    forumCallbacks.set('f1', { onNewThread });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    const thread = { id: 't1', title: 'Test', slug: 'test' };
    channel._trigger('new_thread', { thread });
    expect(onNewThread).toHaveBeenCalledWith(thread);
  });

  it('dispatches thread_pinned to callback', () => {
    const onThreadPinned = vi.fn();
    forumCallbacks.set('f1', { onThreadPinned });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    channel._trigger('thread_pinned', { thread_id: 't1', is_pinned: true });
    expect(onThreadPinned).toHaveBeenCalledWith({ thread_id: 't1', is_pinned: true });
  });

  it('dispatches thread_locked to callback', () => {
    const onThreadLocked = vi.fn();
    forumCallbacks.set('f1', { onThreadLocked });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    channel._trigger('thread_locked', { thread_id: 't1', is_locked: true });
    expect(onThreadLocked).toHaveBeenCalledWith({ thread_id: 't1', is_locked: true });
  });

  it('dispatches thread_deleted to callback', () => {
    const onThreadDeleted = vi.fn();
    forumCallbacks.set('f1', { onThreadDeleted });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    channel._trigger('thread_deleted', { thread_id: 't1' });
    expect(onThreadDeleted).toHaveBeenCalledWith({ thread_id: 't1' });
  });

  it('dispatches member_joined to callback', () => {
    const onMemberJoined = vi.fn();
    forumCallbacks.set('f1', { onMemberJoined });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    const user = { id: 'u1', username: 'alice' };
    channel._trigger('member_joined', { user });
    expect(onMemberJoined).toHaveBeenCalledWith(user);
  });

  it('dispatches member_left to callback', () => {
    const onMemberLeft = vi.fn();
    forumCallbacks.set('f1', { onMemberLeft });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    channel._trigger('member_left', { user_id: 'u1' });
    expect(onMemberLeft).toHaveBeenCalledWith({ user_id: 'u1' });
  });

  it('dispatches stats_update to callback', () => {
    const onStatsUpdate = vi.fn();
    forumCallbacks.set('f1', { onStatsUpdate });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    const stats = { member_count: 10, post_count: 50, thread_count: 5 };
    channel._trigger('stats_update', stats);
    expect(onStatsUpdate).toHaveBeenCalledWith(stats);
  });

  it('dispatches forum_stats to the same onStatsUpdate callback', () => {
    const onStatsUpdate = vi.fn();
    forumCallbacks.set('f1', { onStatsUpdate });
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);

    const stats = { member_count: 20, post_count: 100, thread_count: 10 };
    channel._trigger('forum_stats', stats);
    expect(onStatsUpdate).toHaveBeenCalledWith(stats);
  });

  it('does not throw when no callbacks registered', () => {
    setupForumHandlers(channel as never, 'forum:f1', 'f1', maps, () => forumCallbacks);
    // Trigger event with no callbacks set for forumId
    expect(() => channel._trigger('new_thread', { thread: {} })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Thread Handlers
// ---------------------------------------------------------------------------
describe('setupThreadHandlers', () => {
  let channel: ReturnType<typeof createMockChannel>;
  let maps: ReturnType<typeof makeMaps>;
  let threadCallbacks: Map<string, ThreadChannelCallbacks>;

  beforeEach(() => {
    vi.clearAllMocks();
    channel = createMockChannel();
    maps = makeMaps();
    threadCallbacks = new Map();
  });

  it('registers handlers only once', () => {
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);
    const firstCallCount = channel.on.mock.calls.length;

    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);
    expect(channel.on.mock.calls.length).toBe(firstCallCount);
  });

  it('sets up Presence and stores it', () => {
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);
    expect(MockPresence).toHaveBeenCalledWith(channel);
    expect(maps.presences.has('thread:t1')).toBe(true);
  });

  it('registers all thread events', () => {
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);
    const events = channel.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('new_comment');
    expect(events).toContain('comment_edited');
    expect(events).toContain('comment_deleted');
    expect(events).toContain('vote_changed');
    expect(events).toContain('comment_vote_changed');
    expect(events).toContain('typing');
    expect(events).toContain('poll_updated');
    expect(events).toContain('thread_status_changed');
    expect(events).toContain('thread_stats');
  });

  it('dispatches new_comment', () => {
    const onNewComment = vi.fn();
    threadCallbacks.set('t1', { onNewComment });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    const comment = { id: 'c1', content: 'hi', author_id: 'u1' };
    channel._trigger('new_comment', { comment });
    expect(onNewComment).toHaveBeenCalledWith(comment);
  });

  it('dispatches comment_edited', () => {
    const onCommentEdited = vi.fn();
    threadCallbacks.set('t1', { onCommentEdited });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    const comment = { id: 'c1', content: 'edited' };
    channel._trigger('comment_edited', { comment });
    expect(onCommentEdited).toHaveBeenCalledWith(comment);
  });

  it('dispatches comment_deleted', () => {
    const onCommentDeleted = vi.fn();
    threadCallbacks.set('t1', { onCommentDeleted });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    channel._trigger('comment_deleted', { comment_id: 'c1' });
    expect(onCommentDeleted).toHaveBeenCalledWith({ comment_id: 'c1' });
  });

  it('dispatches vote_changed', () => {
    const onVoteChanged = vi.fn();
    threadCallbacks.set('t1', { onVoteChanged });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    const data = { thread_id: 't1', upvotes: 3, downvotes: 1, score: 2 };
    channel._trigger('vote_changed', data);
    expect(onVoteChanged).toHaveBeenCalledWith(data);
  });

  it('dispatches typing', () => {
    const onTyping = vi.fn();
    threadCallbacks.set('t1', { onTyping });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    channel._trigger('typing', { user_id: 'u1', username: 'bob', is_typing: true });
    expect(onTyping).toHaveBeenCalled();
  });

  it('dispatches poll_updated', () => {
    const onPollUpdated = vi.fn();
    threadCallbacks.set('t1', { onPollUpdated });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    const poll = { thread_id: 't1', poll: { id: 'p1', question: 'Q?', options: [] } };
    channel._trigger('poll_updated', poll);
    expect(onPollUpdated).toHaveBeenCalledWith(poll);
  });

  it('dispatches thread_status_changed', () => {
    const onThreadStatusChanged = vi.fn();
    threadCallbacks.set('t1', { onThreadStatusChanged });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    channel._trigger('thread_status_changed', { thread_id: 't1', is_locked: true, is_pinned: false });
    expect(onThreadStatusChanged).toHaveBeenCalledWith({
      thread_id: 't1',
      is_locked: true,
      is_pinned: false,
    });
  });

  it('dispatches thread_stats to onVoteChanged', () => {
    const onVoteChanged = vi.fn();
    threadCallbacks.set('t1', { onVoteChanged });
    setupThreadHandlers(channel as never, 'thread:t1', 't1', maps, () => threadCallbacks);

    const stats = { thread_id: 't1', upvotes: 10, downvotes: 2, score: 8 };
    channel._trigger('thread_stats', stats);
    expect(onVoteChanged).toHaveBeenCalledWith(stats);
  });
});
