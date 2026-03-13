import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Hoisted mocks (available inside vi.mock factories) ───────────────

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
      token: 'mock-token-abc',
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

// Import mocked modules so we can assert on them
import { connectSocket, disconnectSocket } from '../connectionLifecycle';
import { sendTypingDebounced, sendReaction } from '../socketUtils';
import {
  joinUserChannel as joinUserChannelImpl,
  leaveUserChannel as leaveUserChannelImpl,
} from '../userChannel';
import {
  joinPresenceLobby as joinPresenceLobbyImpl,
  leavePresenceLobby as leavePresenceLobbyImpl,
  isFriendOnline as isFriendOnlineImpl,
  getOnlineFriends as getOnlineFriendsImpl,
  getOnlineUsers as getOnlineUsersImpl,
  isUserOnline as isUserOnlineImpl,
  getAllOnlineStatuses as getAllOnlineStatusesImpl,
} from '../presenceManager';
import {
  joinConversation as joinConvImpl,
  leaveConversation as leaveConvImpl,
} from '../conversationChannel';
import {
  joinGroupChannel as joinGroupImpl,
  leaveGroupChannel as leaveGroupImpl,
} from '../groupChannel';
import {
  joinForum as joinForumImpl,
  leaveForum as leaveForumImpl,
  subscribeToForum as subscribeImpl,
  unsubscribeFromForum as unsubscribeImpl,
} from '../forumChannel';
import {
  joinThread as joinThreadImpl,
  leaveThread as leaveThreadImpl,
  voteOnThread as voteThreadImpl,
  voteOnComment as voteCommentImpl,
  sendComment as sendCommentImpl,
  sendThreadTyping as sendThreadTypingImpl,
  voteOnPoll as voteOnPollImpl,
  getThreadViewers as getThreadViewersImpl,
} from '../threadChannel';

describe('SocketManager', () => {
  let manager: SocketManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SocketManager();
  });

  // ── Connection lifecycle ───────────────────────────────────────────

  describe('connect / disconnect', () => {
    it('delegates connect() to connectSocket', async () => {
      await manager.connect();
      expect(connectSocket).toHaveBeenCalledTimes(1);
    });

    it('delegates disconnect() to disconnectSocket', () => {
      manager.disconnect();
      expect(disconnectSocket).toHaveBeenCalledTimes(1);
    });

    it('isConnected() returns false when socket is null', () => {
      expect(manager.isConnected()).toBe(false);
    });

    it('getSocket() returns null initially', () => {
      expect(manager.getSocket()).toBeNull();
    });
  });

  // ── reconnectWithNewToken ──────────────────────────────────────────

  describe('reconnectWithNewToken', () => {
    it('disconnects, waits, then reconnects', async () => {
      vi.useFakeTimers();
      const promise = manager.reconnectWithNewToken();
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(disconnectSocket).toHaveBeenCalledTimes(1);
      expect(connectSocket).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('re-joins user channel and presence lobby after reconnect', async () => {
      vi.useFakeTimers();
      const promise = manager.reconnectWithNewToken();
      await vi.advanceTimersByTimeAsync(200);
      await promise;

      expect(joinUserChannelImpl).toHaveBeenCalledWith(
        null,
        'user-1',
        expect.any(Map),
        expect.any(Map),
        expect.any(Function)
      );
      expect(joinPresenceLobbyImpl).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // ── User channel ──────────────────────────────────────────────────

  describe('user channel', () => {
    it('joinUserChannel delegates to implementation', () => {
      const ch = manager.joinUserChannel('user-1');
      expect(joinUserChannelImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leaveUserChannel delegates to implementation', () => {
      manager.leaveUserChannel('user-1');
      expect(leaveUserChannelImpl).toHaveBeenCalledWith('user-1', expect.any(Map));
    });
  });

  // ── Presence ──────────────────────────────────────────────────────

  describe('presence', () => {
    it('joinPresenceLobby delegates correctly', () => {
      const ch = manager.joinPresenceLobby();
      expect(joinPresenceLobbyImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leavePresenceLobby delegates correctly', () => {
      manager.leavePresenceLobby();
      expect(leavePresenceLobbyImpl).toHaveBeenCalled();
    });

    it('isFriendOnline delegates with userId', () => {
      manager.isFriendOnline('friend-1');
      expect(isFriendOnlineImpl).toHaveBeenCalledWith('friend-1', expect.any(Map));
    });

    it('getOnlineFriends returns array', () => {
      const result = manager.getOnlineFriends();
      expect(getOnlineFriendsImpl).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('getOnlineUsers delegates with conversationId', () => {
      manager.getOnlineUsers('conv-1');
      expect(getOnlineUsersImpl).toHaveBeenCalledWith('conv-1', expect.any(Map));
    });

    it('isUserOnline delegates with conversationId and userId', () => {
      manager.isUserOnline('conv-1', 'user-2');
      expect(isUserOnlineImpl).toHaveBeenCalledWith('conv-1', 'user-2', expect.any(Map));
    });

    it('getAllOnlineStatuses returns a Map', () => {
      const result = manager.getAllOnlineStatuses();
      expect(getAllOnlineStatusesImpl).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Map);
    });
  });

  // ── Status change listeners ────────────────────────────────────────

  describe('onStatusChange', () => {
    it('registers a listener and returns unsubscribe fn', () => {
      const cb = vi.fn();
      const unsub = manager.onStatusChange(cb);
      expect(typeof unsub).toBe('function');
    });

    it('unsubscribe removes the listener', () => {
      const cb = vi.fn();
      const unsub = manager.onStatusChange(cb);
      unsub();
      // No throw — listener silently removed
    });
  });

  // ── Conversation channel ──────────────────────────────────────────

  describe('conversation channel', () => {
    it('joinConversation delegates correctly', () => {
      const ch = manager.joinConversation('conv-42');
      expect(joinConvImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leaveConversation delegates correctly', () => {
      manager.leaveConversation('conv-42');
      expect(leaveConvImpl).toHaveBeenCalled();
    });
  });

  // ── Group channel ──────────────────────────────────────────────────

  describe('group channel', () => {
    it('joinGroupChannel delegates correctly', () => {
      const ch = manager.joinGroupChannel('group-1');
      expect(joinGroupImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leaveGroupChannel delegates correctly', () => {
      manager.leaveGroupChannel('group-1');
      expect(leaveGroupImpl).toHaveBeenCalledWith('group-1', expect.any(Map));
    });
  });

  // ── Forum channel ─────────────────────────────────────────────────

  describe('forum channel', () => {
    it('joinForum delegates with callbacks', () => {
      const cbs = { onNewThread: vi.fn() };
      const ch = manager.joinForum('forum-1', cbs);
      expect(joinForumImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leaveForum delegates correctly', () => {
      manager.leaveForum('forum-1');
      expect(leaveForumImpl).toHaveBeenCalled();
    });

    it('subscribeToForum resolves with result', async () => {
      const result = await manager.subscribeToForum('forum-1');
      expect(subscribeImpl).toHaveBeenCalledWith('forum-1', expect.any(Map));
      expect(result).toEqual({ subscribed: true });
    });

    it('unsubscribeFromForum resolves with result', async () => {
      const result = await manager.unsubscribeFromForum('forum-1');
      expect(unsubscribeImpl).toHaveBeenCalledWith('forum-1', expect.any(Map));
      expect(result).toEqual({ subscribed: false });
    });
  });

  // ── Thread channel ────────────────────────────────────────────────

  describe('thread channel', () => {
    it('joinThread delegates with callbacks', () => {
      const ch = manager.joinThread('thread-1', { onNewComment: vi.fn() });
      expect(joinThreadImpl).toHaveBeenCalled();
      expect(ch).toBe(mockChannel);
    });

    it('leaveThread delegates correctly', () => {
      manager.leaveThread('thread-1');
      expect(leaveThreadImpl).toHaveBeenCalled();
    });

    it('voteOnThread sends value', async () => {
      await manager.voteOnThread('thread-1', 1);
      expect(voteThreadImpl).toHaveBeenCalledWith('thread-1', 1, expect.any(Map));
    });

    it('voteOnComment sends threadId, commentId, value', async () => {
      await manager.voteOnComment('thread-1', 'c1', -1);
      expect(voteCommentImpl).toHaveBeenCalledWith('thread-1', 'c1', -1, expect.any(Map));
    });

    it('sendComment sends content and optional parentId', async () => {
      await manager.sendComment('thread-1', 'hello', 'parent-1');
      expect(sendCommentImpl).toHaveBeenCalledWith(
        'thread-1',
        'hello',
        expect.any(Map),
        'parent-1'
      );
    });

    it('sendThreadTyping delegates correctly', () => {
      manager.sendThreadTyping('thread-1', true);
      expect(sendThreadTypingImpl).toHaveBeenCalledWith('thread-1', true, expect.any(Map));
    });

    it('voteOnPoll delegates correctly', async () => {
      await manager.voteOnPoll('thread-1', 'opt-1');
      expect(voteOnPollImpl).toHaveBeenCalledWith('thread-1', 'opt-1', expect.any(Map));
    });

    it('getThreadViewers delegates correctly', async () => {
      const result = await manager.getThreadViewers('thread-1');
      expect(getThreadViewersImpl).toHaveBeenCalledWith('thread-1', expect.any(Map));
      expect(result).toEqual({ viewers: [] });
    });
  });

  // ── Messaging utilities ───────────────────────────────────────────

  describe('sendTyping', () => {
    it('delegates to sendTyping implementation', () => {
      manager.sendTyping('conversation:conv-1', true);
      expect(sendTypingDebounced).toHaveBeenCalledWith(
        'conversation:conv-1',
        true,
        expect.any(Map)
      );
    });
  });

  describe('sendReaction', () => {
    it('delegates to sendReaction implementation', () => {
      manager.sendReaction('conv-1', 'msg-1', '👍', 'add');
      expect(sendReaction).toHaveBeenCalledWith('conv-1', 'msg-1', '👍', 'add', expect.any(Map));
    });

    it('handles remove action', () => {
      manager.sendReaction('conv-1', 'msg-1', '❤️', 'remove');
      expect(sendReaction).toHaveBeenCalledWith('conv-1', 'msg-1', '❤️', 'remove', expect.any(Map));
    });
  });

  // ── getChannel ────────────────────────────────────────────────────

  describe('getChannel', () => {
    it('returns undefined for unknown topic', () => {
      expect(manager.getChannel('unknown:topic')).toBeUndefined();
    });
  });

  // ── peekConversationsPresence ─────────────────────────────────────

  describe('peekConversationsPresence', () => {
    it('delegates to peekConversationsPresence impl', async () => {
      const { peekConversationsPresence: peekImpl } = await import('../socketUtils');
      const cleanup = await manager.peekConversationsPresence(['c1', 'c2']);
      expect(peekImpl).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');
    });
  });
});
