/**
 * Socket Module — Public API
 *
 * Barrel re-export for backward-compatible imports.
 * All consumers can continue using:
 *   import { socketManager, useSocket } from '@/lib/socket'
 *
 * @module lib/socket
 */

export { SocketManager } from './socket-manager';
export { setupForumHandlers, setupThreadHandlers } from './channelHandlers';
export type { ChannelMaps } from './channelHandlers';

export type {
  ForumThreadPayload,
  ForumUserPayload,
  ForumStatsPayload,
  ForumPresenceMeta,
  ForumPresenceMember,
  ForumChannelCallbacks,
  ThreadCommentPayload,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadTypingPayload,
  ThreadPollOption,
  ThreadPollData,
  ThreadPollPayload,
  ThreadPresenceMeta,
  ThreadViewerPayload,
  ThreadChannelCallbacks,
} from './types';

// ── Singleton & Hook ──────────────────────────────────────────────────

import { SocketManager } from './socket-manager';

let _instance: SocketManager | null = null;

/** Lazy singleton — avoids constructing until first access */
function getSocketManager(): SocketManager {
  if (!_instance) {
    _instance = new SocketManager();
  }
  return _instance;
}

/**
 * Shared socket manager instance. Lazily created on first property access
 * via Proxy to avoid unnecessary construction at import time.
 */
// type assertion: Proxy target placeholder, all access is intercepted by handler
export const socketManager: SocketManager = new Proxy({} as SocketManager, {
  get(_target, prop, receiver) {
    return Reflect.get(getSocketManager(), prop, receiver);
  },
});

export function useSocket() {
  return getSocketManager();
}
