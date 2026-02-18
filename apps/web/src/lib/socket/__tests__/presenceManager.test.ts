/**
 * Tests for presenceManager.ts
 *
 * Presence lobby join/leave, friend online/offline tracking,
 * and all presence query functions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  joinPresenceLobby,
  leavePresenceLobby,
  isFriendOnline,
  getOnlineFriends,
  getOnlineUsers,
  isUserOnline,
  getAllOnlineStatuses,
} from '../presenceManager';

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

vi.mock('../../logger', () => ({
  socketLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type PushReceiver = {
  receive: (event: string, cb: (resp: unknown) => void) => PushReceiver;
};

function createMockChannel() {
  const handlers: Record<string, (payload: unknown) => void> = {};
  const receivers: Record<string, (resp: unknown) => void> = {};
  const pushObj: PushReceiver = {
    receive(event: string, cb: (resp: unknown) => void) {
      receivers[event] = cb;
      return pushObj;
    },
  };

  return {
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      handlers[event] = cb;
    }),
    join: vi.fn(() => pushObj),
    leave: vi.fn(),
    _handlers: handlers,
    _receivers: receivers,
    _trigger(event: string, payload: unknown) {
      handlers[event]?.(payload);
    },
    _triggerJoin(event: string, resp: unknown) {
      receivers[event]?.(resp);
    },
  };
}

function createMockSocket() {
  return {
    channel: vi.fn((_topic: string, _params: unknown) => createMockChannel()),
  };
}

// ---------------------------------------------------------------------------
// Presence Query Tests (pure functions)
// ---------------------------------------------------------------------------
describe('Presence queries', () => {
  describe('isFriendOnline', () => {
    it('returns false when lobby not in map', () => {
      expect(isFriendOnline('u1', new Map())).toBe(false);
    });

    it('returns true when user is in lobby set', () => {
      const users = new Map([['lobby', new Set(['u1', 'u2'])]]);
      expect(isFriendOnline('u1', users)).toBe(true);
    });

    it('returns false when user is not in lobby set', () => {
      const users = new Map([['lobby', new Set(['u2'])]]);
      expect(isFriendOnline('u1', users)).toBe(false);
    });

    it('handles string coercion for numeric IDs', () => {
      const users = new Map([['lobby', new Set(['123'])]]);
      expect(isFriendOnline('123', users)).toBe(true);
    });
  });

  describe('getOnlineFriends', () => {
    it('returns empty array when no lobby', () => {
      expect(getOnlineFriends(new Map())).toEqual([]);
    });

    it('returns array of online friend IDs', () => {
      const users = new Map([['lobby', new Set(['u1', 'u2', 'u3'])]]);
      const friends = getOnlineFriends(users);
      expect(friends).toHaveLength(3);
      expect(friends).toContain('u1');
      expect(friends).toContain('u2');
      expect(friends).toContain('u3');
    });
  });

  describe('getOnlineUsers', () => {
    it('returns empty array for unknown conversation', () => {
      expect(getOnlineUsers('unknown', new Map())).toEqual([]);
    });

    it('returns users for a specific conversation', () => {
      const users = new Map([['conv:abc', new Set(['u1', 'u2'])]]);
      expect(getOnlineUsers('conv:abc', users)).toHaveLength(2);
    });
  });

  describe('isUserOnline', () => {
    it('returns false for missing conversation', () => {
      expect(isUserOnline('conv:x', 'u1', new Map())).toBe(false);
    });

    it('returns false for empty userId', () => {
      const users = new Map([['conv:x', new Set(['u1'])]]);
      expect(isUserOnline('conv:x', '', users)).toBe(false);
    });

    it('returns true when user present', () => {
      const users = new Map([['conv:x', new Set(['u1'])]]);
      expect(isUserOnline('conv:x', 'u1', users)).toBe(true);
    });

    it('returns false when user absent', () => {
      const users = new Map([['conv:x', new Set(['u2'])]]);
      expect(isUserOnline('conv:x', 'u1', users)).toBe(false);
    });
  });

  describe('getAllOnlineStatuses', () => {
    it('returns a copy of the map', () => {
      const original = new Map([['lobby', new Set(['u1'])]]);
      const copy = getAllOnlineStatuses(original);
      expect(copy).not.toBe(original);
      expect(copy.get('lobby')).toBe(original.get('lobby'));
    });

    it('handles empty map', () => {
      const result = getAllOnlineStatuses(new Map());
      expect(result.size).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// joinPresenceLobby / leavePresenceLobby
// ---------------------------------------------------------------------------
describe('joinPresenceLobby', () => {
  let channels: Map<string, ReturnType<typeof createMockChannel>>;
  let presences: Map<string, unknown>;
  let onlineUsers: Map<string, Set<string>>;
  let notifyStatusChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    channels = new Map();
    presences = new Map();
    onlineUsers = new Map();
    notifyStatusChange = vi.fn();
  });

  it('returns null when socket is null', () => {
    const ch = joinPresenceLobby(null, channels as never, presences as never, onlineUsers, notifyStatusChange);
    expect(ch).toBeNull();
  });

  it('returns existing channel if already joined', () => {
    const existing = createMockChannel();
    channels.set('presence:lobby', existing as never);

    const socket = createMockSocket();
    const ch = joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);
    expect(ch).toBe(existing);
    expect(socket.channel).not.toHaveBeenCalled();
  });

  it('creates channel with correct topic and params', () => {
    const socket = createMockSocket();
    joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);
    expect(socket.channel).toHaveBeenCalledWith('presence:lobby', { include_contact_presence: true });
  });

  it('registers friend_online and friend_offline handlers', () => {
    const socket = createMockSocket();
    joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);

    const ch = channels.get('presence:lobby')!;
    const events = ch.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('friend_online');
    expect(events).toContain('friend_offline');
    expect(events).toContain('status_update');
    expect(events).toContain('friend_status_changed');
  });

  it('dispatches friend_online to notifyStatusChange', () => {
    const socket = createMockSocket();
    joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);

    // Simulate join success first to create the lobby set
    const ch = channels.get('presence:lobby')!;
    ch._triggerJoin('ok', {});

    // Now trigger friend_online
    ch._trigger('friend_online', { user_id: 'u42', status: 'online' });
    expect(notifyStatusChange).toHaveBeenCalledWith('lobby', 'u42', true);
  });

  it('dispatches friend_offline to notifyStatusChange', () => {
    const socket = createMockSocket();
    joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);

    const ch = channels.get('presence:lobby')!;
    ch._triggerJoin('ok', {});
    onlineUsers.get('lobby')?.add('u42');

    ch._trigger('friend_offline', { user_id: 'u42' });
    expect(notifyStatusChange).toHaveBeenCalledWith('lobby', 'u42', false);
  });

  it('cleans up on join error', () => {
    const socket = createMockSocket();
    joinPresenceLobby(socket as never, channels as never, presences as never, onlineUsers, notifyStatusChange);

    const ch = channels.get('presence:lobby')!;
    ch._triggerJoin('error', { reason: 'unauthorized' });

    expect(channels.has('presence:lobby')).toBe(false);
  });
});

describe('leavePresenceLobby', () => {
  it('leaves channel and cleans up state', () => {
    const ch = createMockChannel();
    const channels = new Map([['presence:lobby', ch]]);
    const presences = new Map([['presence:lobby', {}]]);
    const onlineUsers = new Map([['lobby', new Set(['u1'])]]);

    leavePresenceLobby(channels as never, presences as never, onlineUsers);

    expect(ch.leave).toHaveBeenCalled();
    expect(channels.has('presence:lobby')).toBe(false);
    expect(presences.has('presence:lobby')).toBe(false);
    expect(onlineUsers.has('lobby')).toBe(false);
  });

  it('does nothing if not joined', () => {
    const channels = new Map();
    leavePresenceLobby(channels as never, new Map() as never, new Map());
    // no error
  });
});
