/**
 * Socket Manager — Forum & Thread channel delegations.
 *
 * Extracted from socket-manager.ts to keep file sizes manageable.
 * Each function accepts the shared SocketManagerState and delegates
 * to the corresponding channel implementation.
 */

import type { Channel } from 'phoenix';
import type { SocketManagerState } from './connectionLifecycle';
import {
  joinForum as joinForumImpl,
  leaveForum as leaveForumImpl,
  subscribeToForum as subscribeToForumImpl,
  unsubscribeFromForum as unsubscribeFromForumImpl,
} from './forumChannel';
import {
  joinThread as joinThreadImpl,
  leaveThread as leaveThreadImpl,
  voteOnThread as voteOnThreadImpl,
  voteOnComment as voteOnCommentImpl,
  sendComment as sendCommentImpl,
  sendThreadTyping as sendThreadTypingImpl,
  voteOnPoll as voteOnPollImpl,
  getThreadViewers as getThreadViewersImpl,
} from './threadChannel';
import type {
  ForumChannelCallbacks,
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
  ThreadPollData,
} from './types';

// Re-export types so consumers can still import them via socket-manager
export type {
  ForumChannelCallbacks,
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
  ThreadPollData,
};

// ── Forum channel operations ────────────────────────────────────────

/**
 * unknown for the socket module.
 */
/**
 * join Forum for the socket module.
 *
 * @param state - The state.
 * @param forumId - The forum id.
 * @param callbacks - The callbacks.
 */
export function joinForum(
  state: SocketManagerState,
  forumId: string,
  callbacks?: ForumChannelCallbacks
): Channel | null {
  return joinForumImpl(
    state.socket,
    forumId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.forumCallbacks,
    callbacks
  );
}

/**
 * unknown for the socket module.
 */
/**
 * leave Forum for the socket module.
 *
 * @param state - The state.
 * @param forumId - The forum id.
 * @returns The result.
 */
export function leaveForum(state: SocketManagerState, forumId: string): void {
  leaveForumImpl(
    forumId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.forumCallbacks
  );
}

/**
 * unknown for the socket module.
 */
/**
 * Subscribes to to forum.
 *
 * @param state - The state.
 * @param forumId - The forum id.
 */
export function subscribeToForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return subscribeToForumImpl(forumId, state.channels);
}

/**
 * unknown for the socket module.
 */
/**
 * unsubscribe From Forum for the socket module.
 *
 * @param state - The state.
 * @param forumId - The forum id.
 */
export function unsubscribeFromForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return unsubscribeFromForumImpl(forumId, state.channels);
}

// ── Thread channel operations ───────────────────────────────────────

/**
 * unknown for the socket module.
 */
/**
 * join Thread for the socket module.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param callbacks - The callbacks.
 */
export function joinThread(
  state: SocketManagerState,
  threadId: string,
  callbacks?: ThreadChannelCallbacks
): Channel | null {
  return joinThreadImpl(
    state.socket,
    threadId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.threadCallbacks,
    callbacks
  );
}

/**
 * unknown for the socket module.
 */
/**
 * leave Thread for the socket module.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @returns The result.
 */
export function leaveThread(state: SocketManagerState, threadId: string): void {
  leaveThreadImpl(
    threadId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.threadCallbacks
  );
}

/**
 * unknown for the socket module.
 */
/**
 * vote On Thread for the socket module.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param value - The value to set.
 */
export function voteOnThread(
  state: SocketManagerState,
  threadId: string,
  value: 1 | -1 | 0
): Promise<ThreadVotePayload> {
  return voteOnThreadImpl(threadId, value, state.channels);
}

/**
 * unknown for the socket module.
 */
/**
 * vote On Comment for the socket module.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param commentId - The comment id.
 * @param value - The value to set.
 */
export function voteOnComment(
  state: SocketManagerState,
  threadId: string,
  commentId: string,
  value: 1 | -1 | 0
): Promise<CommentVotePayload> {
  return voteOnCommentImpl(threadId, commentId, value, state.channels);
}

/**
 * unknown for the socket module.
 */
/**
 * Dispatches comment.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param content - The content to render.
 * @param parentId - The parent id.
 */
export function sendComment(
  state: SocketManagerState,
  threadId: string,
  content: string,
  parentId?: string
): Promise<{ comment_id: string }> {
  return sendCommentImpl(threadId, content, state.channels, parentId);
}

/**
 * unknown for the socket module.
 */
/**
 * Dispatches thread typing.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param isTyping - The is typing.
 */
export function sendThreadTyping(
  state: SocketManagerState,
  threadId: string,
  isTyping: boolean
): void {
  sendThreadTypingImpl(threadId, isTyping, state.channels);
}

/**
 * unknown for the socket module.
 */
/**
 * vote On Poll for the socket module.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @param optionId - The option id.
 */
export function voteOnPoll(
  state: SocketManagerState,
  threadId: string,
  optionId: string
): Promise<{ poll: ThreadPollData }> {
  return voteOnPollImpl(threadId, optionId, state.channels);
}

/**
 * unknown for the socket module.
 */
/**
 * Retrieves thread viewers.
 *
 * @param state - The state.
 * @param threadId - The thread id.
 * @returns The thread viewers.
 */
export function getThreadViewers(
  state: SocketManagerState,
  threadId: string
): Promise<{ viewers: ThreadViewerPayload[] }> {
  return getThreadViewersImpl(threadId, state.channels);
}
