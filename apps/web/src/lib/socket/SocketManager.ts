/**
 * Socket Manager
 *
 * Singleton manager for Phoenix WebSocket connections.
 * Orchestrates connection lifecycle and delegates channel-specific
 * logic to dedicated submodules for maintainability.
 *
 * @module lib/socket/SocketManager
 */

import { Socket, Channel, Presence } from 'phoenix';
import { useAuthStore } from '@/modules/auth/store';
import { useChatStore } from '@/modules/chat/store';
import { socketLogger as logger } from '../logger';
import { setupForumHandlers, setupThreadHandlers } from './channelHandlers';
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
import type {
  ForumChannelCallbacks,
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
  ThreadPollData,
} from './types';

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

const SOCKET_URL = getSocketUrl();

logger.debug('Configured URL:', SOCKET_URL);
logger.debug('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
logger.debug('VITE_API_URL:', import.meta.env.VITE_API_URL);

// ── Socket Manager Class ──────────────────────────────────────────────

export class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map();
  private reconnectTimer: number | null = null;
  private statusListeners: Set<
    (conversationId: string, userId: string, isOnline: boolean) => void
  > = new Set();
  private connectionPromise: Promise<void> | null = null;
  private lastJoinAttempts: Map<string, number> = new Map();
  private channelHandlersSetUp: Set<string> = new Set();
  private readonly JOIN_DEBOUNCE_MS = 1000;

  // Forum/thread callback registries
  private forumCallbacks: Map<string, ForumChannelCallbacks> = new Map();
  private threadCallbacks: Map<string, ThreadChannelCallbacks> = new Map();

  // Peek timeout tracking
  private peekTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  // ── Connection Lifecycle ──────────────────────────────────────────

  connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = useAuthStore.getState().token;
    logger.debug('connect() called, token exists:', !!token);
    if (!token) {
      logger.warn('Cannot connect to socket: no auth token');
      return Promise.resolve();
    }

    if (this.socket?.isConnected()) {
      logger.debug('Already connected');
      return Promise.resolve();
    }

    logger.debug('Connecting to:', SOCKET_URL);
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        logger.error('Socket connection timeout after 15s');
        this.connectionPromise = null;
        reject(new Error('Socket connection timeout'));
      }, 15000);

      this.socket = new Socket(SOCKET_URL, {
        params: { token },
        reconnectAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries - 1), 30000),
        heartbeatIntervalMs: 30000,
      });

      this.socket.onOpen(() => {
        clearTimeout(connectionTimeout);
        logger.log('Socket connected to:', SOCKET_URL);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.connectionPromise = null;
        resolve();
      });

      this.socket.onClose(() => {
        logger.log('Socket disconnected');
        this.connectionPromise = null;
      });

      this.socket.onError((error: unknown) => {
        clearTimeout(connectionTimeout);
        logger.error('Socket error:', error);
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.connect();
    }).catch((err) => {
      logger.warn('Socket connection failed, app will work in offline mode:', err);
    });

    return this.connectionPromise ?? Promise.resolve();
  }

  disconnect() {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.presences.clear();
    this.onlineUsers.clear();
    this.channelHandlersSetUp.clear();
    this.lastJoinAttempts.clear();
    this.forumCallbacks.clear();
    this.threadCallbacks.clear();
    this.socket?.disconnect();
    this.socket = null;
    this.connectionPromise = null;
  }

  async reconnectWithNewToken(): Promise<void> {
    logger.log('Reconnecting socket with new token...');
    const channelTopics = Array.from(this.channels.keys());
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.connect();

    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      this.joinUserChannel(userId);
      this.joinPresenceLobby();
    }

    logger.log(`Socket reconnected. Previous channels: ${channelTopics.length}`);
  }

  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // ── User Channel (delegated) ─────────────────────────────────────

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

  // ── Presence (delegated) ──────────────────────────────────────────

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

  onStatusChange(
    callback: (conversationId: string, userId: string, isOnline: boolean) => void
  ): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatusChange(conversationId: string, userId: string, isOnline: boolean) {
    this.statusListeners.forEach((callback) => callback(conversationId, userId, isOnline));
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

  // ── Conversation Channels (delegated) ─────────────────────────────

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

  // ── Group Channels (delegated) ────────────────────────────────────

  joinGroupChannel(channelId: string): Channel | null {
    return joinGroupChannelImpl(this.socket, channelId, this.channels, this.connect.bind(this));
  }

  leaveGroupChannel(channelId: string) {
    leaveGroupChannelImpl(channelId, this.channels);
  }

  // ── Forum Channels ───────────────────────────────────────────────

  joinForum(forumId: string, callbacks?: ForumChannelCallbacks): Channel | null {
    const topic = `forum:${forumId}`;

    if (callbacks) {
      this.forumCallbacks.set(forumId, callbacks);
    }

    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') return existingChannel;
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
    }

    if (!this.socket?.isConnected()) {
      logger.warn('Cannot join forum: socket not connected');
      return null;
    }

    const channel = this.socket.channel(topic, {});
    this.channels.set(topic, channel);

    setupForumHandlers(
      channel,
      topic,
      forumId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      () => this.forumCallbacks
    );

    channel
      .join()
      .receive('ok', () => logger.log(`Joined forum channel: ${forumId}`))
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join forum channel ${forumId}:`, resp);
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.forumCallbacks.delete(forumId);
      });

    return channel;
  }

  leaveForum(forumId: string) {
    const topic = `forum:${forumId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      logger.log(`Leaving forum: ${forumId}`);
      channel.leave();
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      this.forumCallbacks.delete(forumId);
    }
  }

  subscribeToForum(forumId: string): Promise<{ subscribed: boolean }> {
    const topic = `forum:${forumId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to forum channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('subscribe', {})
        .receive('ok', (resp: unknown) => resolve(resp as { subscribed: boolean }))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  unsubscribeFromForum(forumId: string): Promise<{ subscribed: boolean }> {
    const topic = `forum:${forumId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to forum channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('unsubscribe', {})
        .receive('ok', (resp: unknown) => resolve(resp as { subscribed: boolean }))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  // ── Thread Channels ───────────────────────────────────────────────

  joinThread(threadId: string, callbacks?: ThreadChannelCallbacks): Channel | null {
    const topic = `thread:${threadId}`;

    if (callbacks) {
      this.threadCallbacks.set(threadId, callbacks);
    }

    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') return existingChannel;
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
    }

    if (!this.socket?.isConnected()) {
      logger.warn('Cannot join thread: socket not connected');
      return null;
    }

    const channel = this.socket.channel(topic, {});
    this.channels.set(topic, channel);

    setupThreadHandlers(
      channel,
      topic,
      threadId,
      {
        channels: this.channels,
        presences: this.presences,
        channelHandlersSetUp: this.channelHandlersSetUp,
      },
      () => this.threadCallbacks
    );

    channel
      .join()
      .receive('ok', () => logger.log(`Joined thread channel: ${threadId}`))
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join thread channel ${threadId}:`, resp);
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.threadCallbacks.delete(threadId);
      });

    return channel;
  }

  leaveThread(threadId: string) {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      logger.log(`Leaving thread: ${threadId}`);
      channel.leave();
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      this.threadCallbacks.delete(threadId);
    }
  }

  voteOnThread(threadId: string, value: 1 | -1 | 0): Promise<ThreadVotePayload> {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to thread channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('vote', { value })
        .receive('ok', (resp: unknown) => resolve(resp as ThreadVotePayload))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  voteOnComment(
    threadId: string,
    commentId: string,
    value: 1 | -1 | 0
  ): Promise<CommentVotePayload> {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to thread channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('vote_comment', { comment_id: commentId, value })
        .receive('ok', (resp: unknown) => resolve(resp as CommentVotePayload))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  sendComment(
    threadId: string,
    content: string,
    parentId?: string
  ): Promise<{ comment_id: string }> {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to thread channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('new_comment', { content, parent_id: parentId })
        .receive('ok', (resp: unknown) => resolve(resp as { comment_id: string }))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  sendThreadTyping(threadId: string, isTyping: boolean) {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (channel?.state === 'joined') {
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  voteOnPoll(threadId: string, optionId: string): Promise<{ poll: ThreadPollData }> {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to thread channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('vote_poll', { option_id: optionId })
        .receive('ok', (resp: unknown) => resolve(resp as { poll: ThreadPollData }))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  getThreadViewers(threadId: string): Promise<{ viewers: ThreadViewerPayload[] }> {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (!channel || channel.state !== 'joined') {
      return Promise.reject(new Error('Not connected to thread channel'));
    }
    return new Promise((resolve, reject) => {
      channel
        .push('get_viewers', {})
        .receive('ok', (resp: unknown) => resolve(resp as { viewers: ThreadViewerPayload[] }))
        .receive('error', (resp: unknown) => reject(resp));
    });
  }

  // ── Utility Methods ───────────────────────────────────────────────

  sendTyping(topic: string, isTyping: boolean) {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  sendReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    action: 'add' | 'remove'
  ): void {
    const topic = `conversation:${conversationId}`;
    const channel = this.channels.get(topic);
    if (channel?.state === 'joined') {
      const eventName = action === 'add' ? 'add_reaction' : 'remove_reaction';
      channel.push(eventName, { message_id: messageId, emoji });
    }
  }

  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  async peekConversationsPresence(conversationIds: string[]): Promise<() => void> {
    if (!this.socket?.isConnected()) {
      try {
        await this.connect();
      } catch {
        return () => {};
      }
    }

    const channelsToLeave: string[] = [];
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    conversationIds.forEach((convId) => {
      const topic = `conversation:${convId}`;
      const existingChannel = this.channels.get(topic);
      if (!existingChannel || existingChannel.state !== 'joined') {
        this.joinConversation(convId);
        channelsToLeave.push(convId);
      }
    });

    if (channelsToLeave.length > 0) {
      timeoutId = setTimeout(() => {
        if (timeoutId) this.peekTimeouts.delete(timeoutId);
        channelsToLeave.forEach((convId) => {
          const { activeConversationId } = useChatStore.getState();
          if (convId !== activeConversationId) {
            this.leaveConversation(convId);
          }
        });
      }, 2000);
      this.peekTimeouts.add(timeoutId);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.peekTimeouts.delete(timeoutId);
      }
      channelsToLeave.forEach((convId) => {
        const { activeConversationId } = useChatStore.getState();
        if (convId !== activeConversationId) {
          this.leaveConversation(convId);
        }
      });
    };
  }
}
