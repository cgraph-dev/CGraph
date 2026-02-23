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

export function subscribeToForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return subscribeToForumImpl(forumId, state.channels);
}

export function unsubscribeFromForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return unsubscribeFromForumImpl(forumId, state.channels);
}

// ── Thread channel operations ───────────────────────────────────────

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

export function voteOnThread(
  state: SocketManagerState,
  threadId: string,
  value: 1 | -1 | 0
): Promise<ThreadVotePayload> {
  return voteOnThreadImpl(threadId, value, state.channels);
}

export function voteOnComment(
  state: SocketManagerState,
  threadId: string,
  commentId: string,
  value: 1 | -1 | 0
): Promise<CommentVotePayload> {
  return voteOnCommentImpl(threadId, commentId, value, state.channels);
}

export function sendComment(
  state: SocketManagerState,
  threadId: string,
  content: string,
  parentId?: string
): Promise<{ comment_id: string }> {
  return sendCommentImpl(threadId, content, state.channels, parentId);
}

export function sendThreadTyping(
  state: SocketManagerState,
  threadId: string,
  isTyping: boolean
): void {
  sendThreadTypingImpl(threadId, isTyping, state.channels);
}

export function voteOnPoll(
  state: SocketManagerState,
  threadId: string,
  optionId: string
): Promise<{ poll: ThreadPollData }> {
  return voteOnPollImpl(threadId, optionId, state.channels);
}

export function getThreadViewers(
  state: SocketManagerState,
  threadId: string
): Promise<{ viewers: ThreadViewerPayload[] }> {
  return getThreadViewersImpl(threadId, state.channels);
}
