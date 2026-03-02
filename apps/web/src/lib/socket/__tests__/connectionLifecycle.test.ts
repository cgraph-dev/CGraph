/**
 * Tests for connectionLifecycle.ts
 *
 * getResumeParams, updateSequence, and disconnectSocket.
 * connectSocket requires real Phoenix Socket — tested via integration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock dependencies (before importing module)
// ---------------------------------------------------------------------------
vi.mock('phoenix', () => ({
  Socket: vi.fn(),
  Channel: vi.fn(),
  Presence: vi.fn(),
}));

vi.mock('@cgraph/socket', () => ({
  exponentialBackoffWithJitter: vi.fn(() => () => 1000),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: { getState: vi.fn(() => ({ token: null })) },
}));

vi.mock('../../logger', () => ({
  socketLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getResumeParams, updateSequence, disconnectSocket } from '../connectionLifecycle';
import type { SocketManagerState } from '../connectionLifecycle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeState(overrides?: Partial<SocketManagerState>): SocketManagerState {
  return {
    socket: null,
    channels: new Map(),
    presences: new Map(),
    onlineUsers: new Map(),
    reconnectTimer: null,
    connectionPromise: null,
    channelHandlersSetUp: new Set(),
    lastJoinAttempts: new Map(),
    forumCallbacks: new Map(),
    threadCallbacks: new Map(),
    sessionId: null,
    lastSequence: 0,
    reconnectAttempts: 0,
    ...overrides,
  };
}

// Mock sessionStorage
const sessionStore: Record<string, string> = {};
const mockSessionStorage = {
  getItem: vi.fn((k: string) => sessionStore[k] ?? null),
  setItem: vi.fn((k: string, v: string) => {
    sessionStore[k] = v;
  }),
  removeItem: vi.fn((k: string) => {
    delete sessionStore[k];
  }),
};

Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('getResumeParams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(sessionStore)) delete sessionStore[k];
  });

  it('returns empty object when no session stored', () => {
    expect(getResumeParams()).toEqual({});
  });

  it('returns resume params when session data exists', () => {
    sessionStore['ws_session_id'] = 'sess-123';
    sessionStore['ws_last_sequence'] = '42';

    const params = getResumeParams();
    expect(params).toEqual({
      resume_session_id: 'sess-123',
      last_sequence: 42,
    });
  });

  it('returns empty if only session_id is stored (missing sequence)', () => {
    sessionStore['ws_session_id'] = 'sess-123';
    expect(getResumeParams()).toEqual({});
  });

  it('returns empty if only sequence is stored (missing session_id)', () => {
    sessionStore['ws_last_sequence'] = '42';
    expect(getResumeParams()).toEqual({});
  });
});

describe('updateSequence', () => {
  it('updates lastSequence from _seq', () => {
    const state = makeState();
    updateSequence(state, { _seq: 7 });
    expect(state.lastSequence).toBe(7);
  });

  it('updates sessionId from _session_id', () => {
    const state = makeState();
    updateSequence(state, { _session_id: 'new-sess' });
    expect(state.sessionId).toBe('new-sess');
  });

  it('updates sessionId from new_session_id (resume)', () => {
    const state = makeState({ sessionId: 'old' });
    updateSequence(state, { new_session_id: 'resumed-sess' });
    expect(state.sessionId).toBe('resumed-sess');
  });

  it('does not change state for unrelated payload', () => {
    const state = makeState({ lastSequence: 5, sessionId: 'keep' });
    updateSequence(state, { foo: 'bar' });
    expect(state.lastSequence).toBe(5);
    expect(state.sessionId).toBe('keep');
  });

  it('handles both _seq and _session_id in one payload', () => {
    const state = makeState();
    updateSequence(state, { _seq: 10, _session_id: 'combo' });
    expect(state.lastSequence).toBe(10);
    expect(state.sessionId).toBe('combo');
  });
});

describe('disconnectSocket', () => {
  it('leaves all channels and clears state', () => {
    const ch1 = { leave: vi.fn() };
    const ch2 = { leave: vi.fn() };
    const mockSocket = { disconnect: vi.fn() };

    const state = makeState({
      socket: mockSocket as never,
      channels: new Map([
        ['ch:1', ch1 as never],
        ['ch:2', ch2 as never],
      ]),
      presences: new Map([['ch:1', {} as never]]),
      onlineUsers: new Map([['lobby', new Set(['u1'])]]),
      channelHandlersSetUp: new Set(['ch:1']),
      lastJoinAttempts: new Map([['ch:1', 1000]]),
      forumCallbacks: new Map([['f1', {} as never]]),
      threadCallbacks: new Map([['t1', {} as never]]),
      connectionPromise: Promise.resolve(),
    });

    disconnectSocket(state);

    expect(ch1.leave).toHaveBeenCalled();
    expect(ch2.leave).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(state.socket).toBeNull();
    expect(state.channels.size).toBe(0);
    expect(state.presences.size).toBe(0);
    expect(state.onlineUsers.size).toBe(0);
    expect(state.channelHandlersSetUp.size).toBe(0);
    expect(state.lastJoinAttempts.size).toBe(0);
    expect(state.forumCallbacks.size).toBe(0);
    expect(state.threadCallbacks.size).toBe(0);
    expect(state.connectionPromise).toBeNull();
  });

  it('handles null socket gracefully', () => {
    const state = makeState();
    expect(() => disconnectSocket(state)).not.toThrow();
  });
});
