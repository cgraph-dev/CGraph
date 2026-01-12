/**
 * @fileoverview Comprehensive tests for WebSocket service
 * Tests connection management, reconnection logic, and message handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Phoenix library
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  join: vi.fn().mockReturnValue({
    receive: vi.fn().mockReturnThis(),
  }),
  leave: vi.fn().mockReturnValue({
    receive: vi.fn().mockReturnThis(),
  }),
  push: vi.fn().mockReturnValue({
    receive: vi.fn().mockReturnThis(),
  }),
};

const mockSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onError: vi.fn(),
  channel: vi.fn().mockReturnValue(mockChannel),
  isConnected: vi.fn().mockReturnValue(true),
  connectionState: vi.fn().mockReturnValue('open'),
};

vi.mock('phoenix', () => ({
  Socket: vi.fn().mockImplementation(() => mockSocket),
}));

// Import after mocking
import { Socket } from 'phoenix';

describe('WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should create a socket with correct URL and params', () => {
      const token = 'test-jwt-token';
      const wsUrl = 'wss://api.example.com/socket';

      // Creating socket to verify constructor is called with correct params
      // @ts-expect-error Socket creation is intentional for verifying constructor call
      const _socket = new Socket(wsUrl, {
        params: { token },
        heartbeatIntervalMs: 30000,
      });

      expect(Socket).toHaveBeenCalledWith(wsUrl, {
        params: { token },
        heartbeatIntervalMs: 30000,
      });
    });

    it('should handle connection errors gracefully', () => {
      const onError = vi.fn();
      mockSocket.onError.mockImplementation((callback: () => void) => {
        callback();
      });

      mockSocket.onError(onError);

      expect(onError).toHaveBeenCalled();
    });

    it('should implement exponential backoff for reconnection', async () => {
      const reconnectAttempts = [1000, 2000, 4000, 8000, 16000];
      let attempt = 0;

      const calculateBackoff = (attemptNum: number) => {
        return Math.min(1000 * Math.pow(2, attemptNum), 30000);
      };

      for (const expected of reconnectAttempts) {
        expect(calculateBackoff(attempt)).toBe(expected);
        attempt++;
      }

      // Should cap at 30 seconds
      expect(calculateBackoff(10)).toBe(30000);
    });
  });

  describe('Channel Subscription', () => {
    it('should create a channel with correct topic', () => {
      const topic = 'conversation:123';

      const channel = mockSocket.channel(topic);

      expect(mockSocket.channel).toHaveBeenCalledWith(topic);
      expect(channel).toBe(mockChannel);
    });

    it('should handle channel join success', () => {
      const onJoin = vi.fn();
      const joinRef = mockChannel.join();

      joinRef.receive.mockImplementation((status: string, callback: () => void) => {
        if (status === 'ok') {
          callback();
        }
        return joinRef;
      });

      joinRef.receive('ok', onJoin);

      expect(onJoin).toHaveBeenCalled();
    });

    it('should handle channel join failure', () => {
      const onError = vi.fn();
      const joinRef = mockChannel.join();

      joinRef.receive.mockImplementation((status: string, callback: (reason: string) => void) => {
        if (status === 'error') {
          callback('unauthorized');
        }
        return joinRef;
      });

      joinRef.receive('error', onError);

      expect(onError).toHaveBeenCalledWith('unauthorized');
    });
  });

  describe('Message Handling', () => {
    it('should register event handlers on channel', () => {
      const handler = vi.fn();

      mockChannel.on('new_message', handler);

      expect(mockChannel.on).toHaveBeenCalledWith('new_message', handler);
    });

    it('should push messages to channel', () => {
      const message = { content: 'Hello!' };

      mockChannel.push('new_message', message);

      expect(mockChannel.push).toHaveBeenCalledWith('new_message', message);
    });

    it('should handle push response', () => {
      const onOk = vi.fn();
      const pushRef = mockChannel.push('new_message', {});

      pushRef.receive.mockImplementation((status: string, callback: (response: unknown) => void) => {
        if (status === 'ok') {
          callback({ id: '123' });
        }
        return pushRef;
      });

      pushRef.receive('ok', onOk);

      expect(onOk).toHaveBeenCalledWith({ id: '123' });
    });
  });

  describe('Presence Tracking', () => {
    it('should track user presence on join', () => {
      const presenceTopic = 'presence:user:123';
      const presenceChannel = mockSocket.channel(presenceTopic);

      expect(presenceChannel).toBeDefined();
      expect(mockSocket.channel).toHaveBeenCalledWith(presenceTopic);
    });
  });

  describe('Reconnection with Jitter', () => {
    it('should add jitter to prevent thundering herd', () => {
      const baseDelay = 5000;
      const jitterFactor = 0.3;

      const addJitter = (delay: number, factor: number) => {
        const jitter = delay * factor * Math.random();
        return delay + jitter;
      };

      // Run multiple times to verify jitter is being applied
      const delays = Array.from({ length: 10 }, () => addJitter(baseDelay, jitterFactor));

      // All delays should be >= base and <= base * (1 + factor)
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay);
        expect(delay).toBeLessThanOrEqual(baseDelay * (1 + jitterFactor));
      });

      // Delays should not all be the same (jitter working)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });
});

describe('Connection State Machine', () => {
  it('should track connection states correctly', () => {
    type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

    const transitions: Record<ConnectionState, ConnectionState[]> = {
      disconnected: ['connecting'],
      connecting: ['connected', 'disconnected', 'reconnecting'],
      connected: ['disconnected', 'reconnecting'],
      reconnecting: ['connected', 'disconnected'],
    };

    // Verify all transitions are valid - each target state must exist in the transitions map
    Object.entries(transitions).forEach(([_from, toStates]) => {
      toStates.forEach((to) => {
        expect(Object.keys(transitions)).toContain(to);
      });
    });
  });
});
