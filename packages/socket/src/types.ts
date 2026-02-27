/**
 * Phoenix Socket Types
 *
 * Type definitions for Phoenix channels and socket communication.
 */

export interface SocketOptions {
  url: string;
  token?: string;
  params?: Record<string, unknown>;
  reconnectAfterMs?: (tries: number) => number;
  heartbeatIntervalMs?: number;
  timeout?: number;
  /** Maximum reconnection attempts before triggering circuit breaker (default: 10) */
  maxReconnectAttempts?: number;
  /** Callback invoked when maxReconnectAttempts is reached */
  onMaxReconnects?: () => void;
}

export interface ChannelOptions {
  topic: string;
  params?: Record<string, unknown>;
}

export interface ChannelMessage<T = unknown> {
  event: string;
  payload: T;
  ref?: string;
}

export interface ChannelResponse<T = unknown> {
  status: 'ok' | 'error' | 'timeout';
  response: T;
}

export interface PresenceState {
  [key: string]: {
    metas: PresenceMeta[];
  };
}

export interface PresenceMeta {
  phx_ref: string;
  online_at: string;
  [key: string]: unknown;
}

export interface PresenceDiff {
  joins: PresenceState;
  leaves: PresenceState;
}

// Channel event types
export type ChannelEvent =
  | 'phx_join'
  | 'phx_leave'
  | 'phx_reply'
  | 'phx_error'
  | 'phx_close'
  | 'presence_state'
  | 'presence_diff';

// Connection state
export type ConnectionState = 'connecting' | 'open' | 'closing' | 'closed';

// Message handler types
export type MessageHandler<T = unknown> = (payload: T) => void;
export type ErrorHandler = (error: unknown) => void;
export type CloseHandler = (event: { code: number; reason: string }) => void;
