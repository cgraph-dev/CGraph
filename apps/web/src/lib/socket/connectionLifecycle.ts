/**
 * Connection Lifecycle Module
 *
 * Handles Phoenix Socket connection, disconnection, and reconnection.
 * Extracted from SocketManager for maintainability.
 *
 * @module lib/socket/connectionLifecycle
 */

import { Socket, Channel, Presence } from 'phoenix';
import { useAuthStore } from '@/modules/auth/store';
import { socketLogger as logger } from '../logger';
import type { ForumChannelCallbacks, ThreadChannelCallbacks } from './types';

// ── Socket URL resolution ─────────────────────────────────────────────

function getSocketUrl(): string {
  const envUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_WS_URL;

  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/socket`;
  }

  return 'ws://localhost:4000/socket';
}

export const SOCKET_URL = getSocketUrl();

logger.debug('Configured URL:', SOCKET_URL);
logger.debug('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
logger.debug('VITE_API_URL:', import.meta.env.VITE_API_URL);

// ── State interface shared across modules ─────────────────────────────

export interface SocketManagerState {
  socket: Socket | null;
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  onlineUsers: Map<string, Set<string>>;
  reconnectTimer: number | null;
  connectionPromise: Promise<void> | null;
  channelHandlersSetUp: Set<string>;
  lastJoinAttempts: Map<string, number>;
  forumCallbacks: Map<string, ForumChannelCallbacks>;
  threadCallbacks: Map<string, ThreadChannelCallbacks>;
  // Session resumption state
  sessionId: string | null;
  lastSequence: number;
}

/**
 * Establish a Phoenix Socket connection using the current auth token.
 */
export function connectSocket(state: SocketManagerState): Promise<void> {
  if (state.connectionPromise) {
    return state.connectionPromise;
  }

  const token = useAuthStore.getState().token;
  logger.debug('connect() called, token exists:', !!token);
  if (!token) {
    logger.warn('Cannot connect to socket: no auth token');
    return Promise.resolve();
  }

  if (state.socket?.isConnected()) {
    logger.debug('Already connected');
    return Promise.resolve();
  }

  logger.debug('Connecting to:', SOCKET_URL);
  state.connectionPromise = new Promise<void>((resolve, reject) => {
    const connectionTimeout = setTimeout(() => {
      logger.error('Socket connection timeout after 15s');
      state.connectionPromise = null;
      reject(new Error('Socket connection timeout'));
    }, 15000);

    state.socket = new Socket(SOCKET_URL, {
      params: { token },
      reconnectAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries - 1), 30000),
      heartbeatIntervalMs: 30000,
    });

    state.socket.onOpen(() => {
      clearTimeout(connectionTimeout);
      logger.log('Socket connected to:', SOCKET_URL);
      if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = null;
      }
      state.connectionPromise = null;
      resolve();
    });

    state.socket.onClose(() => {
      logger.log('Socket disconnected');
      // Preserve session info for resumption on reconnect  
      if (state.sessionId) {
        try {
          sessionStorage.setItem('ws_session_id', state.sessionId);
          sessionStorage.setItem('ws_last_sequence', String(state.lastSequence));
        } catch {
          // sessionStorage unavailable
        }
      }
      state.connectionPromise = null;
    });

    state.socket.onError((error: unknown) => {
      clearTimeout(connectionTimeout);
      logger.error('Socket error:', error);
      state.connectionPromise = null;
      reject(error);
    });

    state.socket.connect();
  }).catch((err) => {
    logger.warn('Socket connection failed, app will work in offline mode:', err);
  });

  return state.connectionPromise ?? Promise.resolve();
}

/**
 * Disconnect and clean up all channels and state.
 */
export function disconnectSocket(state: SocketManagerState) {
  state.channels.forEach((channel) => channel.leave());
  state.channels.clear();
  state.presences.clear();
  state.onlineUsers.clear();
  state.channelHandlersSetUp.clear();
  state.lastJoinAttempts.clear();
  state.forumCallbacks.clear();
  state.threadCallbacks.clear();
  state.socket?.disconnect();
  state.socket = null;
  state.connectionPromise = null;
}

/**
 * Get session resumption params for user channel join.
 * Returns saved session_id and last_sequence if available.
 */
export function getResumeParams(): Record<string, unknown> {
  try {
    const sessionId = sessionStorage.getItem('ws_session_id');
    const lastSeq = sessionStorage.getItem('ws_last_sequence');

    if (sessionId && lastSeq) {
      return {
        resume_session_id: sessionId,
        last_sequence: parseInt(lastSeq, 10),
      };
    }
  } catch {
    // sessionStorage unavailable
  }
  return {};
}

/**
 * Update sequence tracking from a received event payload.
 */
export function updateSequence(state: SocketManagerState, payload: Record<string, unknown>): void {
  if (typeof payload._seq === 'number') {
    state.lastSequence = payload._seq;
  }
  if (typeof payload._session_id === 'string') {
    state.sessionId = payload._session_id;
  }
  // Handle resume_complete with new session_id
  if (typeof payload.new_session_id === 'string') {
    state.sessionId = payload.new_session_id;
  }
}
