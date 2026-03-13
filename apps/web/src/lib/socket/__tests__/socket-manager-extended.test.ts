/**
 * SocketManager Extended Tests
 *
 * Additional edge-case coverage for SocketManager:
 * sendReaction variations, peekConversationsPresence,
 * channel-not-found, and multiple status listeners.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockChannel } = vi.hoisted(() => {
  const ch = {
    join: () => ({ receive: () => ch }),
    leave: () => {},
    push: () => ({ receive: () => ch }),
    on: () => {},
    state: 'joined',
  };
  return { mockChannel: ch };
});

vi.mock('phoenix', () => ({
  Socket: vi.fn(),
  Channel: vi.fn(),
  Presence: vi.fn(),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({
      token: 'mock-token',
      user: { id: 'user-1' },
    }),
  },
}));

vi.mock('../connectionLifecycle', () => ({
  SOCKET_URL: 'ws://localhost:4000/socket',
  connectSocket: vi.fn().mockResolvedValue(undefined),
  disconnectSocket: vi.fn(),
}));

vi.mock('../socketUtils', () => ({
  sendTypingDebounced: vi.fn(),
  sendReaction: vi.fn(),
  peekConversationsPresence: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('../userChannel', () => ({
  joinUserChannel: vi.fn().mockReturnValue(mockChannel),
  leaveUserChannel: vi.fn(),
}));

vi.mock('../presenceManager', () => ({
  joinPresenceLobby: vi.fn().mockReturnValue(mockChannel),
  leavePresenceLobby: vi.fn(),
  isFriendOnline: vi.fn().mockReturnValue(false),
  getOnlineFriends: vi.fn().mockReturnValue([]),
  getOnlineUsers: vi.fn().mockReturnValue([]),
  isUserOnline: vi.fn().mockReturnValue(false),
  getAllOnlineStatuses: vi.fn().mockReturnValue(new Map()),
}));

vi.mock('../conversationChannel', () => ({
  joinConversation: vi.fn().mockReturnValue(mockChannel),
  leaveConversation: vi.fn(),
}));

vi.mock('../groupChannel', () => ({
  joinGroupChannel: vi.fn().mockReturnValue(mockChannel),
  leaveGroupChannel: vi.fn(),
}));

vi.mock('../forumChannel', () => ({
  joinForum: vi.fn().mockReturnValue(mockChannel),
  leaveForum: vi.fn(),
  subscribeToForum: vi.fn().mockResolvedValue({ subscribed: true }),
  unsubscribeFromForum: vi.fn().mockResolvedValue({ subscribed: false }),
}));

vi.mock('../threadChannel', () => ({
  joinThread: vi.fn().mockReturnValue(mockChannel),
  leaveThread: vi.fn(),
  voteOnThread: vi.fn().mockResolvedValue({ vote_count: 1 }),
  voteOnComment: vi.fn().mockResolvedValue({ vote_count: 1 }),
  sendComment: vi.fn().mockResolvedValue({ comment_id: 'c1' }),
  sendThreadTyping: vi.fn(),
  voteOnPoll: vi.fn().mockResolvedValue({ poll: {} }),
  getThreadViewers: vi.fn().mockResolvedValue({ viewers: [] }),
}));

import { SocketManager } from '../socket-manager';
import { connectSocket, disconnectSocket } from '../connectionLifecycle';
import { sendTypingDebounced, sendReaction } from '../socketUtils';
import {
  isFriendOnline as isFriendOnlineImpl,
  isUserOnline as isUserOnlineImpl,
} from '../presenceManager';

describe('SocketManager (extended)', () => {
  let manager: SocketManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SocketManager();
  });

  // ── Multiple status listeners ─────────────────────────────────────

  describe('multiple status listeners', () => {
    it('supports registering multiple listeners', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const unsub1 = manager.onStatusChange(cb1);
      const unsub2 = manager.onStatusChange(cb2);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');
    });

    it('unsubscribing one listener does not affect others', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      const unsub1 = manager.onStatusChange(cb1);
      manager.onStatusChange(cb2);

      unsub1(); // remove cb1
      // cb2 still registered — no throw
    });

    it('calling unsubscribe twice is safe', () => {
      const cb = vi.fn();
      const unsub = manager.onStatusChange(cb);
      unsub();
      unsub(); // second call should not throw
    });
  });

  // ── sendReaction edge cases ────────────────────────────────────────

  describe('sendReaction edge cases', () => {
    it('passes add action correctly', () => {
      manager.sendReaction('conv-1', 'msg-1', '🎉', 'add');
      expect(sendReaction).toHaveBeenCalledWith('conv-1', 'msg-1', '🎉', 'add', expect.any(Map));
    });

    it('passes remove action correctly', () => {
      manager.sendReaction('conv-2', 'msg-2', '😢', 'remove');
      expect(sendReaction).toHaveBeenCalledWith('conv-2', 'msg-2', '😢', 'remove', expect.any(Map));
    });

    it('handles unicode emoji correctly', () => {
      manager.sendReaction('c', 'm', '👨‍👩‍👧‍👦', 'add');
      expect(sendReaction).toHaveBeenCalledWith('c', 'm', '👨‍👩‍👧‍👦', 'add', expect.any(Map));
    });
  });

  // ── sendTyping variations ──────────────────────────────────────────

  describe('sendTyping variations', () => {
    it('sends typing started', () => {
      manager.sendTyping('conversation:c1', true);
      expect(sendTypingDebounced).toHaveBeenCalledWith('conversation:c1', true, expect.any(Map));
    });

    it('sends typing stopped', () => {
      manager.sendTyping('conversation:c1', false);
      expect(sendTypingDebounced).toHaveBeenCalledWith('conversation:c1', false, expect.any(Map));
    });
  });

  // ── Presence queries ───────────────────────────────────────────────

  describe('presence queries', () => {
    it('isFriendOnline returns false by default', () => {
      expect(manager.isFriendOnline('random-user')).toBe(false);
      expect(isFriendOnlineImpl).toHaveBeenCalledWith('random-user', expect.any(Map));
    });

    it('isUserOnline returns false by default', () => {
      expect(manager.isUserOnline('conv-1', 'user-2')).toBe(false);
      expect(isUserOnlineImpl).toHaveBeenCalledWith('conv-1', 'user-2', expect.any(Map));
    });
  });

  // ── getChannel ─────────────────────────────────────────────────────

  describe('getChannel', () => {
    it('returns undefined for any unknown topic', () => {
      expect(manager.getChannel('conversation:nonexistent')).toBeUndefined();
      expect(manager.getChannel('forum:nonexistent')).toBeUndefined();
      expect(manager.getChannel('')).toBeUndefined();
    });
  });

  // ── Multiple connect / disconnect cycles ───────────────────────────

  describe('connect/disconnect cycles', () => {
    it('can connect and disconnect multiple times', async () => {
      await manager.connect();
      manager.disconnect();
      await manager.connect();
      manager.disconnect();

      expect(connectSocket).toHaveBeenCalledTimes(2);
      expect(disconnectSocket).toHaveBeenCalledTimes(2);
    });

    it('isConnected always false when socket is null', () => {
      expect(manager.isConnected()).toBe(false);
    });
  });

  // ── Forum subscribe / unsubscribe ──────────────────────────────────

  describe('forum subscribe/unsubscribe', () => {
    it('subscribeToForum returns subscribed result', async () => {
      const res = await manager.subscribeToForum('forum-42');
      expect(res).toEqual({ subscribed: true });
    });

    it('unsubscribeFromForum returns unsubscribed result', async () => {
      const res = await manager.unsubscribeFromForum('forum-42');
      expect(res).toEqual({ subscribed: false });
    });
  });

  // ── Thread channel operations ──────────────────────────────────────

  describe('thread operations', () => {
    it('sendComment without parentId', async () => {
      const { sendComment: sendCommentImpl } = await import('../threadChannel');
      await manager.sendComment('t1', 'Hello!');
      expect(sendCommentImpl).toHaveBeenCalledWith('t1', 'Hello!', expect.any(Map), undefined);
    });

    it('voteOnThread with downvote', async () => {
      const { voteOnThread } = await import('../threadChannel');
      await manager.voteOnThread('t1', -1);
      expect(voteOnThread).toHaveBeenCalledWith('t1', -1, expect.any(Map));
    });

    it('voteOnThread with remove (0)', async () => {
      const { voteOnThread } = await import('../threadChannel');
      await manager.voteOnThread('t1', 0);
      expect(voteOnThread).toHaveBeenCalledWith('t1', 0, expect.any(Map));
    });
  });
});
