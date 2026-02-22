/**
 * Socket Manager — Singleton orchestrator for Phoenix WebSocket connections.
 * Delegates channel logic to dedicated submodules.
 */

import type { Channel } from 'phoenix';
import { useAuthStore } from '@/modules/auth/store';
import { socketLogger as logger } from '../logger';
import { connectSocket, disconnectSocket, type SocketManagerState } from './connectionLifecycle';
import {
  sendTyping as sendTypingImpl,
  sendReaction as sendReactionImpl,
  peekConversationsPresence as peekPresenceImpl,
} from './socketUtils';
import {
  joinUserChannel as joinUserChannelImpl,
  leaveUserChannel as leaveUserChannelImpl,
} from './userChannel';
import {
  joinPresenceLobby as joinPresenceLobbyImpl,
  leavePresenceLobby as leavePresenceLobbyImpl,
  isFriendOnline as isFriendOnlineImpl,
  getOnlineFriends as getOnlineFriendsImpl,
  getOnlineUsers as getOnlineUsersImpl,
  isUserOnline as isUserOnlineImpl,
  getAllOnlineStatuses as getAllOnlineStatusesImpl,
} from './presenceManager';
import {
  joinConversation as joinConversationImpl,
  leaveConversation as leaveConversationImpl,
} from './conversationChannel';
import {
  joinGroupChannel as joinGroupChannelImpl,
  leaveGroupChannel as leaveGroupChannelImpl,
} from './groupChannel';
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

export class SocketManager {
  private state: SocketManagerState = {
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
  };
  private statusListeners = new Set<(cId: string, uId: string, online: boolean) => void>();
  private readonly JOIN_DEBOUNCE_MS = 1000;
  private peekTimeouts = new Set<ReturnType<typeof setTimeout>>();

  // State accessors
  private get socket() {
    return this.state.socket;
  }
  private get channels() {
    return this.state.channels;
  }
  private get presences() {
    return this.state.presences;
  }
  private get onlineUsers() {
    return this.state.onlineUsers;
  }
  private get channelHandlersSetUp() {
    return this.state.channelHandlersSetUp;
  }
  private get lastJoinAttempts() {
    return this.state.lastJoinAttempts;
  }
  private get forumCallbacks() {
    return this.state.forumCallbacks;
  }
  private get threadCallbacks() {
    return this.state.threadCallbacks;
  }

  // ── Connection Lifecycle ──────────────────────────────────────────

  connect(): Promise<void> {
    return connectSocket(this.state);
  }

  disconnect() {
    disconnectSocket(this.state);
  }

  async reconnectWithNewToken(): Promise<void> {
    logger.log('Reconnecting socket with new token...');
    this.disconnect();
    await new Promise((r) => setTimeout(r, 100));
    await this.connect();
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      this.joinUserChannel(userId);
      this.joinPresenceLobby();
    }
  }

  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }
  getSocket() {
    return this.socket;
  }

  joinUserChannel(userId: string): Channel | null {
    return joinUserChannelImpl(
      this.socket,
      userId,
      this.channels,
      this.onlineUsers,
      this.notifyStatusChange.bind(this)
    );
  }

  leaveUserChannel(userId: string) {
    leaveUserChannelImpl(userId, this.channels);
  }

  joinPresenceLobby(): Channel | null {
    return joinPresenceLobbyImpl(
      this.socket,
      this.channels,
      this.presences,
      this.onlineUsers,
      this.notifyStatusChange.bind(this)
    );
  }

  leavePresenceLobby() {
    leavePresenceLobbyImpl(this.channels, this.presences, this.onlineUsers);
  }

  isFriendOnline(userId: string): boolean {
    return isFriendOnlineImpl(userId, this.onlineUsers);
  }

  getOnlineFriends(): string[] {
    return getOnlineFriendsImpl(this.onlineUsers);
  }

  onStatusChange(cb: (cId: string, uId: string, online: boolean) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private notifyStatusChange(cId: string, uId: string, online: boolean) {
    this.statusListeners.forEach((cb) => cb(cId, uId, online));
  }

  getOnlineUsers(conversationId: string): string[] {
    return getOnlineUsersImpl(conversationId, this.onlineUsers);
  }

  isUserOnline(conversationId: string, userId: string): boolean {
    return isUserOnlineImpl(conversationId, userId, this.onlineUsers);
  }

  getAllOnlineStatuses(): Map<string, Set<string>> {
    return getAllOnlineStatusesImpl(this.onlineUsers);
  }

  joinConversation(conversationId: string): Channel | null {
    return joinConversationImpl(
      this.socket,
      conversationId,
      this.channels,
      this.presences,
      this.onlineUsers,
      this.channelHandlersSetUp,
      this.lastJoinAttempts,
      this.JOIN_DEBOUNCE_MS,
      this.notifyStatusChange.bind(this),
      this.connect.bind(this)
    );
  }

  leaveConversation(conversationId: string) {
    leaveConversationImpl(
      conversationId,
      this.channels,
      this.channelHandlersSetUp,
      this.presences,
      this.onlineUsers,
      this.lastJoinAttempts
    );
  }

  joinGroupChannel(channelId: string): Channel | null {
    return joinGroupChannelImpl(this.socket, channelId, this.channels, this.connect.bind(this));
  }

  leaveGroupChannel(channelId: string) {
    leaveGroupChannelImpl(channelId, this.channels);
  }

  joinForum(forumId: string, callbacks?: ForumChannelCallbacks): Channel | null {
    return joinForumImpl(
      this.socket,
      forumId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      this.forumCallbacks,
      callbacks
    );
  }

  leaveForum(forumId: string) {
    leaveForumImpl(
      forumId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      this.forumCallbacks
    );
  }

  subscribeToForum(forumId: string): Promise<{ subscribed: boolean }> {
    return subscribeToForumImpl(forumId, this.channels);
  }

  unsubscribeFromForum(forumId: string): Promise<{ subscribed: boolean }> {
    return unsubscribeFromForumImpl(forumId, this.channels);
  }

  joinThread(threadId: string, callbacks?: ThreadChannelCallbacks): Channel | null {
    return joinThreadImpl(
      this.socket,
      threadId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      this.threadCallbacks,
      callbacks
    );
  }

  leaveThread(threadId: string) {
    leaveThreadImpl(
      threadId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      this.threadCallbacks
    );
  }

  voteOnThread(threadId: string, value: 1 | -1 | 0): Promise<ThreadVotePayload> {
    return voteOnThreadImpl(threadId, value, this.channels);
  }

  voteOnComment(
    threadId: string,
    commentId: string,
    value: 1 | -1 | 0
  ): Promise<CommentVotePayload> {
    return voteOnCommentImpl(threadId, commentId, value, this.channels);
  }

  sendComment(
    threadId: string,
    content: string,
    parentId?: string
  ): Promise<{ comment_id: string }> {
    return sendCommentImpl(threadId, content, this.channels, parentId);
  }

  sendThreadTyping(threadId: string, isTyping: boolean) {
    sendThreadTypingImpl(threadId, isTyping, this.channels);
  }

  voteOnPoll(threadId: string, optionId: string): Promise<{ poll: ThreadPollData }> {
    return voteOnPollImpl(threadId, optionId, this.channels);
  }

  getThreadViewers(threadId: string): Promise<{ viewers: ThreadViewerPayload[] }> {
    return getThreadViewersImpl(threadId, this.channels);
  }

  sendTyping(topic: string, isTyping: boolean) {
    sendTypingImpl(topic, isTyping, this.channels);
  }

  sendReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    action: 'add' | 'remove'
  ): void {
    sendReactionImpl(conversationId, messageId, emoji, action, this.channels);
  }

  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  async peekConversationsPresence(conversationIds: string[]): Promise<() => void> {
    return peekPresenceImpl(
      conversationIds,
      this.socket,
      this.channels,
      this.peekTimeouts,
      this.connect.bind(this),
      this.joinConversation.bind(this),
      this.leaveConversation.bind(this)
    );
  }
}
