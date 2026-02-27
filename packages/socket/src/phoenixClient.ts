/**
 * Phoenix Socket Client
 *
 * Base client for connecting to Phoenix channels.
 * Provides connection management, reconnection, and event handling.
 */

import { Socket, Channel } from 'phoenix';
import type { SocketOptions, ChannelOptions, ConnectionState, MessageHandler } from './types';
import { exponentialBackoffWithJitter } from './backoff';

const defaultBackoff = exponentialBackoffWithJitter();

/** Default maximum reconnect attempts before circuit breaker trips */
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/** Client for connecting to and managing Phoenix WebSocket channels with reconnection and event handling. */
export class PhoenixClient {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private options: SocketOptions;
  private connectionState: ConnectionState = 'closed';
  private connectionListeners: Set<(state: ConnectionState) => void> = new Set();

  // Circuit breaker state
  private reconnectAttempts = 0;

  // Session resumption state
  private sessionId: string | null = null;
  private lastSequence = 0;

  constructor(options: SocketOptions) {
    this.options = options;
  }

  /**
   * Connect to the Phoenix socket
   */
  connect(): void {
    if (this.socket) {
      return;
    }

    this.setConnectionState('connecting');

    const backoffFn = this.options.reconnectAfterMs ?? defaultBackoff;
    const maxAttempts = this.options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;

    this.socket = new Socket(this.options.url, {
      params: () => ({
        token: this.options.token,
        ...this.options.params,
        // Session resumption: include sessionId/lastSequence when available
        ...(this.sessionId
          ? { sessionId: this.sessionId, lastSequence: this.lastSequence }
          : {}),
      }),
      reconnectAfterMs: backoffFn,
      // Apply jitter to channel rejoins to prevent thundering herd
      rejoinAfterMs: defaultBackoff,
      heartbeatIntervalMs: this.options.heartbeatIntervalMs,
      timeout: this.options.timeout,
    });

    this.socket.onOpen(() => {
      // Reset circuit breaker on successful connection
      this.reconnectAttempts = 0;
      this.setConnectionState('open');
    });

    this.socket.onClose(() => {
      this.handleReconnectAttempt(maxAttempts);
      this.setConnectionState('closed');
    });

    this.socket.onError(() => {
      this.handleReconnectAttempt(maxAttempts);
      this.setConnectionState('closed');
    });

    this.socket.connect();
  }

  /**
   * Disconnect from the socket
   */
  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.setConnectionState('closing');

    // Leave all channels
    this.channels.forEach((channel) => {
      channel.leave();
    });
    this.channels.clear();

    this.socket.disconnect();
    this.socket = null;
    this.setConnectionState('closed');
  }

  /**
   * Join a channel
   */
  joinChannel(options: ChannelOptions): Channel | null {
    if (!this.socket) {
      console.warn('Socket not connected');
      return null;
    }

    const existingChannel = this.channels.get(options.topic);
    if (existingChannel) {
      return existingChannel;
    }

    const channel = this.socket.channel(options.topic, options.params || {});
    this.channels.set(options.topic, channel);

    channel
      .join()
      .receive('ok', () => {
        console.debug(`Joined channel: ${options.topic}`);
      })
      .receive('error', (resp) => {
        console.error(`Failed to join channel ${options.topic}:`, resp);
        this.channels.delete(options.topic);
      })
      .receive('timeout', () => {
        console.warn(`Timeout joining channel: ${options.topic}`);
      });

    return channel;
  }

  /**
   * Leave a channel
   */
  leaveChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  /**
   * Get a channel by topic
   */
  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'open';
  }

  /**
   * Update token for authenticated connections
   */
  updateToken(token: string): void {
    this.options.token = token;
    // Reconnect with new token if connected
    if (this.socket && this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Update session tracking for resumption on reconnect.
   */
  updateSession(sessionId: string, lastSequence: number): void {
    this.sessionId = sessionId;
    this.lastSequence = lastSequence;
  }

  /**
   * Get current session info for external persistence.
   */
  getSessionInfo(): { sessionId: string | null; lastSequence: number } {
    return { sessionId: this.sessionId, lastSequence: this.lastSequence };
  }

  /**
   * Get current reconnect attempt count (useful for UI indicators).
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /** Increment reconnect attempts and trip circuit breaker if max exceeded. */
  private handleReconnectAttempt(maxAttempts: number): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= maxAttempts) {
      console.warn(
        `[PhoenixClient] Circuit breaker: max reconnect attempts (${maxAttempts}) reached`
      );
      this.options.onMaxReconnects?.();
      // Stop further reconnection by disconnecting the socket
      this.socket?.disconnect();
      this.socket = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }
}

/**
 * Create typed channel event handler
 */
export function createChannelHandler<T>(
  channel: Channel,
  event: string,
  handler: MessageHandler<T>
): () => void {
  const ref = channel.on(
    event,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    handler as (payload?: unknown, ref?: string, joinRef?: string) => void
  );
  return () => channel.off(event, ref);
}

/**
 * Push message to channel with typed response
 */
export function pushToChannel<TPayload extends object, TResponse>(
  channel: Channel,
  event: string,
  payload: TPayload,
  timeout = 10000
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    channel
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      .push(event, payload as Record<string, unknown>, timeout)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      .receive('ok', (response: unknown) => resolve(response as TResponse))
      .receive('error', (error: unknown) => reject(error))
      .receive('timeout', () => reject(new Error('Channel push timeout')));
  });
}
