/**
 * Tests for PhoenixClient circuit breaker, session resumption, and rejoin jitter.
 *
 * @module phoenixClient.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock phoenix module ──────────────────────────────────────────────

let onOpenCb: (() => void) | null = null;
let onCloseCb: (() => void) | null = null;
let onErrorCb: (() => void) | null = null;
let mockDisconnect: ReturnType<typeof vi.fn>;

vi.mock('phoenix', () => {
  return {
    Socket: vi.fn().mockImplementation(() => {
      mockDisconnect = vi.fn();
      return {
        connect: vi.fn(),
        disconnect: mockDisconnect,
        onOpen: (cb: () => void) => {
          onOpenCb = cb;
        },
        onClose: (cb: () => void) => {
          onCloseCb = cb;
        },
        onError: (cb: () => void) => {
          onErrorCb = cb;
        },
        channel: vi.fn().mockReturnValue({
          join: vi.fn().mockReturnValue({
            receive: vi.fn().mockReturnThis(),
          }),
          leave: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
        }),
        isConnected: vi.fn().mockReturnValue(false),
      };
    }),
    Channel: vi.fn(),
  };
});

import { PhoenixClient } from './phoenixClient';
import { Socket } from 'phoenix';

describe('PhoenixClient', () => {
  let client: PhoenixClient;
  const defaultOpts = { url: 'ws://localhost:4000/socket', token: 'test-token' };

  beforeEach(() => {
    onOpenCb = null;
    onCloseCb = null;
    onErrorCb = null;
    vi.mocked(Socket).mockClear();
  });

  describe('circuit breaker', () => {
    it('resets reconnect attempts on successful connection', () => {
      client = new PhoenixClient({ ...defaultOpts, maxReconnectAttempts: 5 });
      client.connect();

      // Simulate a few close events (reconnect attempts)
      onCloseCb?.();
      onCloseCb?.();
      expect(client.getReconnectAttempts()).toBe(2);

      // Successful reconnect
      onOpenCb?.();
      expect(client.getReconnectAttempts()).toBe(0);
    });

    it('calls onMaxReconnects when max attempts reached', () => {
      const onMaxReconnects = vi.fn();
      client = new PhoenixClient({
        ...defaultOpts,
        maxReconnectAttempts: 3,
        onMaxReconnects,
      });
      client.connect();

      // Simulate repeated failures
      onCloseCb?.();
      expect(onMaxReconnects).not.toHaveBeenCalled();
      onCloseCb?.();
      expect(onMaxReconnects).not.toHaveBeenCalled();
      onCloseCb?.(); // 3rd attempt hits the limit
      expect(onMaxReconnects).toHaveBeenCalledOnce();
    });

    it('disconnects socket when circuit breaker trips', () => {
      client = new PhoenixClient({
        ...defaultOpts,
        maxReconnectAttempts: 2,
      });
      client.connect();

      onCloseCb?.();
      onCloseCb?.(); // Trips at 2

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('uses default max of 10 when not specified', () => {
      client = new PhoenixClient(defaultOpts);
      client.connect();

      // 9 closes should not trip
      for (let i = 0; i < 9; i++) {
        onCloseCb?.();
      }
      expect(client.getReconnectAttempts()).toBe(9);

      // 10th trips
      onCloseCb?.();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('counts both close and error events toward limit', () => {
      const onMaxReconnects = vi.fn();
      client = new PhoenixClient({
        ...defaultOpts,
        maxReconnectAttempts: 4,
        onMaxReconnects,
      });
      client.connect();

      onCloseCb?.(); // 1
      onErrorCb?.(); // 2
      onCloseCb?.(); // 3
      expect(onMaxReconnects).not.toHaveBeenCalled();
      onErrorCb?.(); // 4 - trips
      expect(onMaxReconnects).toHaveBeenCalledOnce();
    });
  });

  describe('session resumption', () => {
    it('includes sessionId and lastSequence in connect params when set', () => {
      client = new PhoenixClient(defaultOpts);
      client.updateSession('sess-123', 42);
      client.connect();

      // Get the params function passed to Socket constructor
      const socketCall = vi.mocked(Socket).mock.calls[0];
      const opts = socketCall?.[1] as Record<string, unknown>;
      const paramsFn = opts.params as () => Record<string, unknown>;
      const params = paramsFn();

      expect(params.sessionId).toBe('sess-123');
      expect(params.lastSequence).toBe(42);
      expect(params.token).toBe('test-token');
    });

    it('does not include session params when no session exists', () => {
      client = new PhoenixClient(defaultOpts);
      client.connect();

      const socketCall = vi.mocked(Socket).mock.calls[0];
      const opts = socketCall?.[1] as Record<string, unknown>;
      const paramsFn = opts.params as () => Record<string, unknown>;
      const params = paramsFn();

      expect(params.sessionId).toBeUndefined();
      expect(params.lastSequence).toBeUndefined();
    });

    it('getSessionInfo returns current session state', () => {
      client = new PhoenixClient(defaultOpts);
      expect(client.getSessionInfo()).toEqual({ sessionId: null, lastSequence: 0 });

      client.updateSession('sess-abc', 99);
      expect(client.getSessionInfo()).toEqual({ sessionId: 'sess-abc', lastSequence: 99 });
    });
  });

  describe('rejoin jitter', () => {
    it('passes rejoinAfterMs to Socket options', () => {
      client = new PhoenixClient(defaultOpts);
      client.connect();

      const socketCall = vi.mocked(Socket).mock.calls[0];
      const opts = socketCall?.[1] as Record<string, unknown>;
      expect(opts.rejoinAfterMs).toBeDefined();
      expect(typeof opts.rejoinAfterMs).toBe('function');
    });
  });

  describe('connection state', () => {
    it('reports open state after successful connect', () => {
      client = new PhoenixClient(defaultOpts);
      client.connect();

      expect(client.getConnectionState()).toBe('connecting');
      onOpenCb?.();
      expect(client.getConnectionState()).toBe('open');
      expect(client.isConnected()).toBe(true);
    });

    it('notifies listeners of state changes', () => {
      client = new PhoenixClient(defaultOpts);
      const listener = vi.fn();
      client.onConnectionChange(listener);
      client.connect();

      expect(listener).toHaveBeenCalledWith('connecting');

      onOpenCb?.();
      expect(listener).toHaveBeenCalledWith('open');
    });
  });
});
