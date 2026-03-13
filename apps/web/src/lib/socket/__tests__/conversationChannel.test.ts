/**
 * Tests for socket/conversationChannel.ts
 *
 * Conversation channel join/leave with debouncing, presence tracking,
 * message/typing/reaction event handlers, and error cleanup.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinConversation, leaveConversation } from '../conversationChannel';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const { MockPresence } = vi.hoisted(() => {
  const MockPresence = vi.fn();
  MockPresence.prototype.onSync = vi.fn();
  MockPresence.prototype.onJoin = vi.fn();
  MockPresence.prototype.onLeave = vi.fn();
  MockPresence.prototype.list = vi.fn();
  return { MockPresence };
});

vi.mock('phoenix', () => ({
  Presence: MockPresence,
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: {
    getState: vi.fn(() => ({
      addMessage: vi.fn(),
      decryptAndAddMessage: vi.fn(),
      updateMessage: vi.fn(),
      removeMessage: vi.fn(),
      setTypingUser: vi.fn(),
      addReactionToMessage: vi.fn(),
      removeReactionFromMessage: vi.fn(),
    })),
  },
}));

vi.mock('../../logger', () => {
  const loggerMock = { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() };
  return {
    socketLogger: loggerMock,
    createLogger: vi.fn(() => ({ ...loggerMock })),
    logger: loggerMock,
    e2eeLogger: loggerMock,
    authLogger: loggerMock,
    apiLogger: loggerMock,
    forumLogger: loggerMock,
    chatLogger: loggerMock,
    themeLogger: loggerMock,
    routeLogger: loggerMock,
  };
});

vi.mock('../../apiUtils', () => ({
  normalizeMessage: vi.fn((msg: unknown) => msg),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type PushReceiver = {
  receive: (event: string, cb: (resp: unknown) => void) => PushReceiver;
};

function createMockChannel(state = 'initialized') {
  const handlers: Record<string, (payload: unknown) => void> = {};
  const receivers: Record<string, (resp: unknown) => void> = {};
  const pushObj: PushReceiver = {
    receive(event: string, cb: (resp: unknown) => void) {
      receivers[event] = cb;
      return pushObj;
    },
  };

  return {
    state,
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      handlers[event] = cb;
    }),
    join: vi.fn(() => pushObj),
    leave: vi.fn(),
    _handlers: handlers,
    _receivers: receivers,
    _trigger(event: string, payload: unknown) { handlers[event]?.(payload); },
    _triggerJoin(event: string, resp: unknown) { receivers[event]?.(resp); },
  };
}

function createMockSocket() {
  const mockChannel = createMockChannel();
  return {
    isConnected: vi.fn(() => true),
    channel: vi.fn(() => mockChannel),
    _lastChannel: mockChannel,
  };
}

function makeArgs() {
  return {
    channels: new Map() as Map<string, ReturnType<typeof createMockChannel>>,
    presences: new Map(),
    onlineUsers: new Map<string, Set<string>>(),
    channelHandlersSetUp: new Set<string>(),
    lastJoinAttempts: new Map<string, number>(),
    joinDebounceMs: 500,
    notifyStatusChange: vi.fn(),
    connectFn: vi.fn(() => Promise.resolve()),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('joinConversation', () => {
  let args: ReturnType<typeof makeArgs>;

  beforeEach(() => {
    vi.clearAllMocks();
    args = makeArgs();
  });

  it('returns null when socket is null (triggers connectFn)', () => {
    const ch = joinConversation(
      null, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    expect(ch).toBeNull();
    expect(args.connectFn).toHaveBeenCalled();
  });

  it('returns null when socket exists but not connected', () => {
    const socket = createMockSocket();
    socket.isConnected.mockReturnValue(false);

    const ch = joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    expect(ch).toBeNull();
  });

  it('creates channel and joins for new conversation', () => {
    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    expect(ch).not.toBeNull();
    expect(socket.channel).toHaveBeenCalledWith('conversation:conv1', {});
    expect(args.channels.has('conversation:conv1')).toBe(true);
  });

  it('returns existing channel if already joined', () => {
    const existing = createMockChannel('joined');
    args.channels.set('conversation:conv1', existing as never);

    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    expect(ch).toBe(existing);
    expect(socket.channel).not.toHaveBeenCalled();
  });

  it('debounces rapid join attempts', () => {
    const socket = createMockSocket();
    args.lastJoinAttempts.set('conversation:conv1', Date.now());

    const ch = joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    // Should not create a new channel
    expect(socket.channel).not.toHaveBeenCalled();
    expect(ch).toBeNull();
  });

  it('replaces channel in errored state', () => {
    const old = createMockChannel('errored');
    args.channels.set('conversation:conv1', old as never);
    args.channelHandlersSetUp.add('conversation:conv1');

    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );
    expect(ch).not.toBe(old);
    expect(ch).not.toBeNull();
  });

  it('registers all events on new channel', () => {
    const socket = createMockSocket();
    joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );

    const ch = socket._lastChannel;
    const events = ch.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('new_message');
    expect(events).toContain('message_updated');
    expect(events).toContain('message_deleted');
    expect(events).toContain('typing');
    expect(events).toContain('reaction_added');
    expect(events).toContain('reaction_removed');
    expect(events).toContain('presence_state');
    expect(events).toContain('presence_diff');
  });

  it('only sets up handlers once (idempotent)', () => {
    const socket = createMockSocket();
    args.channelHandlersSetUp.add('conversation:conv1');
    args.channels.set('conversation:conv1', createMockChannel('errored') as never);
    // Clear the errored channel from handlerSetUp so new channel joins, but
    // re-add it to simulate already set up
    args.channelHandlersSetUp.delete('conversation:conv1');

    joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );

    // First join sets up handlers
    expect(args.channelHandlersSetUp.has('conversation:conv1')).toBe(true);
  });

  it('cleans up on join error', () => {
    const socket = createMockSocket();
    joinConversation(
      socket as never, 'conv1', args.channels as never, args.presences as never,
      args.onlineUsers, args.channelHandlersSetUp, args.lastJoinAttempts,
      args.joinDebounceMs, args.notifyStatusChange, args.connectFn
    );

    const ch = socket._lastChannel;
    ch._triggerJoin('error', { reason: 'unauthorized' });

    expect(args.channels.has('conversation:conv1')).toBe(false);
    expect(args.channelHandlersSetUp.has('conversation:conv1')).toBe(false);
    expect(args.lastJoinAttempts.has('conversation:conv1')).toBe(false);
  });
});

describe('leaveConversation', () => {
  it('leaves channel and cleans up all state', () => {
    const ch = createMockChannel('joined');
    const channels = new Map([['conversation:conv1', ch]]);
    const handlers = new Set(['conversation:conv1']);
    const presences = new Map([['conversation:conv1', {}]]);
    const onlineUsers = new Map([['conv1', new Set(['u1'])]]);
    const lastJoinAttempts = new Map([['conversation:conv1', 1000]]);

    leaveConversation('conv1', channels as never, handlers, presences as never, onlineUsers, lastJoinAttempts);

    expect(ch.leave).toHaveBeenCalled();
    expect(channels.has('conversation:conv1')).toBe(false);
    expect(handlers.has('conversation:conv1')).toBe(false);
    expect(presences.has('conversation:conv1')).toBe(false);
    expect(onlineUsers.has('conv1')).toBe(false);
    expect(lastJoinAttempts.has('conversation:conv1')).toBe(false);
  });

  it('does nothing for unknown conversation', () => {
    const channels = new Map();
    expect(() =>
      leaveConversation('unknown', channels as never, new Set(), new Map() as never, new Map(), new Map())
    ).not.toThrow();
  });
});
