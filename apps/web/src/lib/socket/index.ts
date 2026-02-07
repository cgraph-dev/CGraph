/**
 * Socket Module — Public API
 *
 * Barrel re-export for backward-compatible imports.
 * All consumers can continue using:
 *   import { socketManager, useSocket } from '@/lib/socket'
 *
 * @module lib/socket
 */

export { SocketManager } from './SocketManager';
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

import { SocketManager } from './SocketManager';

export const socketManager = new SocketManager();

export function useSocket() {
  return socketManager;
}
