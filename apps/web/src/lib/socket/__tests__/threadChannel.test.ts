/**
 * Tests for threadChannel.ts
 *
 * Thread channel lifecycle: join/leave, voting, commenting,
 * typing indicators, poll voting, viewer tracking.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  joinThread,
  leaveThread,
  voteOnThread,
  voteOnComment,
  sendComment,
  sendThreadTyping,
  voteOnPoll,
  getThreadViewers,
} from '../threadChannel';
import type { ThreadChannelCallbacks } from '../types';

// ---------------------------------------------------------------------------
// Mock channelHandlers
// ---------------------------------------------------------------------------
vi.mock('../channelHandlers', () => ({
  setupThreadHandlers: vi.fn(),
}));

vi.mock('../../logger', () => ({
  socketLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type PushReceiver = {
  receive: (event: string, cb: (resp: unknown) => void) => PushReceiver;
};

function createMockChannel(state: string = 'joined') {
  const receivers: Record<string, (resp: unknown) => void> = {};
  const pushObj: PushReceiver = {
    receive(event: string, cb: (resp: unknown) => void) {
      receivers[event] = cb;
      return pushObj;
    },
  };

  const channel = {
    state,
    join: vi.fn(() => pushObj),
    leave: vi.fn(),
    push: vi.fn(() => pushObj),
    on: vi.fn(),
    _receivers: receivers,
    _triggerPush(event: string, resp: unknown) {
      receivers[event]?.(resp);
    },
  };
  return channel;
}

function createMockSocket(connected = true) {
  return {
    isConnected: vi.fn(() => connected),
    channel: vi.fn((_topic: string, _params: unknown) => createMockChannel('initialized')),
  };
}

function makeState() {
  return {
    channels: new Map<string, ReturnType<typeof createMockChannel>>(),
    presences: new Map(),
    channelHandlersSetUp: new Set<string>(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('threadChannel', () => {
  let state: ReturnType<typeof makeState>;
  let threadCallbacks: Map<string, ThreadChannelCallbacks>;

  beforeEach(() => {
    vi.clearAllMocks();
    state = makeState();
    threadCallbacks = new Map();
  });

  // ── joinThread ──────────────────────────────────────────────────────
  describe('joinThread', () => {
    it('returns null when socket is null', () => {
      const ch = joinThread(null, 't1', state as never, threadCallbacks);
      expect(ch).toBeNull();
    });

    it('returns null when socket is disconnected', () => {
      const socket = createMockSocket(false);
      const ch = joinThread(socket as never, 't1', state as never, threadCallbacks);
      expect(ch).toBeNull();
    });

    it('creates channel, registers it, and calls join', () => {
      const socket = createMockSocket(true);
      const ch = joinThread(socket as never, 't1', state as never, threadCallbacks);
      expect(ch).not.toBeNull();
      expect(socket.channel).toHaveBeenCalledWith('thread:t1', {});
      expect(state.channels.has('thread:t1')).toBe(true);
    });

    it('stores callbacks when provided', () => {
      const socket = createMockSocket(true);
      const cbs: ThreadChannelCallbacks = { onNewComment: vi.fn() };
      joinThread(socket as never, 't1', state as never, threadCallbacks, cbs);
      expect(threadCallbacks.get('t1')).toBe(cbs);
    });

    it('returns existing channel if already joined', () => {
      const existing = createMockChannel('joined');
      state.channels.set('thread:t1', existing as never);

      const socket = createMockSocket(true);
      const ch = joinThread(socket as never, 't1', state as never, threadCallbacks);
      expect(ch).toBe(existing);
      expect(socket.channel).not.toHaveBeenCalled();
    });

    it('returns existing channel if currently joining', () => {
      const existing = createMockChannel('joining');
      state.channels.set('thread:t1', existing as never);

      const socket = createMockSocket(true);
      const ch = joinThread(socket as never, 't1', state as never, threadCallbacks);
      expect(ch).toBe(existing);
    });

    it('replaces channel in errored/closed state', () => {
      const old = createMockChannel('errored');
      state.channels.set('thread:t1', old as never);
      state.channelHandlersSetUp.add('thread:t1');
      state.presences.set('thread:t1', {} as never);

      const socket = createMockSocket(true);
      const ch = joinThread(socket as never, 't1', state as never, threadCallbacks);
      expect(ch).not.toBe(old);
      expect(ch).not.toBeNull();
    });

    it('cleans up on join error', () => {
      const socket = createMockSocket(true);
      const cbs: ThreadChannelCallbacks = { onNewComment: vi.fn() };
      joinThread(socket as never, 't1', state as never, threadCallbacks, cbs);

      // Grab the mock channel to trigger error callback
      const mockCh = state.channels.get('thread:t1') as unknown as ReturnType<
        typeof createMockChannel
      >;
      mockCh._triggerPush('error', { reason: 'unauthorized' });

      expect(state.channels.has('thread:t1')).toBe(false);
      expect(threadCallbacks.has('t1')).toBe(false);
    });
  });

  // ── leaveThread ─────────────────────────────────────────────────────
  describe('leaveThread', () => {
    it('leaves and cleans up all state', () => {
      const ch = createMockChannel('joined');
      state.channels.set('thread:t1', ch as never);
      state.channelHandlersSetUp.add('thread:t1');
      state.presences.set('thread:t1', {} as never);
      threadCallbacks.set('t1', { onNewComment: vi.fn() });

      leaveThread('t1', state as never, threadCallbacks);

      expect(ch.leave).toHaveBeenCalled();
      expect(state.channels.has('thread:t1')).toBe(false);
      expect(state.channelHandlersSetUp.has('thread:t1')).toBe(false);
      expect(state.presences.has('thread:t1')).toBe(false);
      expect(threadCallbacks.has('t1')).toBe(false);
    });

    it('does nothing for unknown thread', () => {
      leaveThread('unknown', state as never, threadCallbacks);
      // no error thrown
    });
  });

  // ── voteOnThread ────────────────────────────────────────────────────
  describe('voteOnThread', () => {
    it('rejects when channel not found', async () => {
      await expect(voteOnThread('t1', 1, new Map() as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('rejects when channel not joined', async () => {
      const ch = createMockChannel('leaving');
      const channels = new Map([['thread:t1', ch]]);
      await expect(voteOnThread('t1', 1, channels as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('pushes vote and resolves on ok', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);
      const payload = { upvotes: 5, downvotes: 1, score: 4, thread_id: 't1' };

      const promise = voteOnThread('t1', 1, channels as never);
      // Trigger ok
      ch._triggerPush('ok', payload);
      const result = await promise;

      expect(ch.push).toHaveBeenCalledWith('vote', { value: 1 });
      expect(result).toEqual(payload);
    });

    it('rejects on push error', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);

      const promise = voteOnThread('t1', -1, channels as never);
      ch._triggerPush('error', 'forbidden');
      await expect(promise).rejects.toBe('forbidden');
    });
  });

  // ── voteOnComment ───────────────────────────────────────────────────
  describe('voteOnComment', () => {
    it('rejects when not connected', async () => {
      await expect(voteOnComment('t1', 'c1', 1, new Map() as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('pushes vote_comment with correct payload', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);
      const payload = { comment_id: 'c1', upvotes: 3, downvotes: 0, score: 3 };

      const promise = voteOnComment('t1', 'c1', 1, channels as never);
      ch._triggerPush('ok', payload);
      const result = await promise;

      expect(ch.push).toHaveBeenCalledWith('vote_comment', { comment_id: 'c1', value: 1 });
      expect(result).toEqual(payload);
    });
  });

  // ── sendComment ─────────────────────────────────────────────────────
  describe('sendComment', () => {
    it('rejects when not connected', async () => {
      await expect(sendComment('t1', 'hello', new Map() as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('sends comment with content and optional parentId', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);
      const resp = { comment_id: 'c42' };

      const promise = sendComment('t1', 'reply text', channels as never, 'c1');
      ch._triggerPush('ok', resp);
      const result = await promise;

      expect(ch.push).toHaveBeenCalledWith('new_comment', {
        content: 'reply text',
        parent_id: 'c1',
      });
      expect(result).toEqual(resp);
    });
  });

  // ── sendThreadTyping ────────────────────────────────────────────────
  describe('sendThreadTyping', () => {
    it('pushes typing indicator when channel is joined', () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);

      sendThreadTyping('t1', true, channels as never);
      expect(ch.push).toHaveBeenCalledWith('typing', { typing: true, is_typing: true });
    });

    it('does nothing when channel not joined', () => {
      const ch = createMockChannel('leaving');
      const channels = new Map([['thread:t1', ch]]);

      sendThreadTyping('t1', true, channels as never);
      expect(ch.push).not.toHaveBeenCalled();
    });

    it('does nothing when channel missing', () => {
      sendThreadTyping('t1', false, new Map() as never);
      // no error
    });
  });

  // ── voteOnPoll ──────────────────────────────────────────────────────
  describe('voteOnPoll', () => {
    it('rejects when not connected', async () => {
      await expect(voteOnPoll('t1', 'opt1', new Map() as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('pushes vote_poll and resolves', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);
      const resp = { poll: { id: 'p1', question: 'Q?', options: [], total_votes: 1 } };

      const promise = voteOnPoll('t1', 'opt1', channels as never);
      ch._triggerPush('ok', resp);
      const result = await promise;

      expect(ch.push).toHaveBeenCalledWith('vote_poll', { option_id: 'opt1' });
      expect(result).toEqual(resp);
    });
  });

  // ── getThreadViewers ────────────────────────────────────────────────
  describe('getThreadViewers', () => {
    it('rejects when not connected', async () => {
      await expect(getThreadViewers('t1', new Map() as never)).rejects.toThrow(
        'Not connected to thread channel'
      );
    });

    it('pushes get_viewers and resolves with viewer list', async () => {
      const ch = createMockChannel('joined');
      const channels = new Map([['thread:t1', ch]]);
      const viewers = [{ user_id: 'u1', username: 'alice', typing: false }];

      const promise = getThreadViewers('t1', channels as never);
      ch._triggerPush('ok', { viewers });
      const result = await promise;

      expect(ch.push).toHaveBeenCalledWith('get_viewers', {});
      expect(result.viewers).toEqual(viewers);
    });
  });
});
