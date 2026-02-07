/**
 * Socket Manager
 *
 * Singleton manager for Phoenix WebSocket connections.
 * Handles connection lifecycle, channel management, presence
 * tracking, and real-time event routing for all features
 * (conversations, groups, forums, threads).
 *
 * @module lib/socket/SocketManager
 */

import { Socket, Channel, Presence } from 'phoenix';
import { useAuthStore } from '@/modules/auth/store';
import { useChatStore, Message, Conversation } from '@/modules/chat/store';
import { useGroupStore, ChannelMessage } from '@/modules/groups/store';
import { useE2EEStore } from '@/lib/crypto/e2eeStore';
import { useIncomingCallStore, type IncomingCall } from '@/modules/calls/store';
import { socketLogger as logger } from '../logger';
import { normalizeMessage, normalizeConversation } from '../apiUtils';
import { setupForumHandlers, setupThreadHandlers } from './channelHandlers';
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

  // ── User Channel ─────────────────────────────────────────────────

  joinUserChannel(userId: string): Channel | null {
    const topic = `user:${userId}`;

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    if (!this.socket) {
      logger.warn('Cannot join user channel: socket not connected');
      return null;
    }

    const channel = this.socket.channel(topic, {});

    // E2EE key revocation — CRITICAL for forward secrecy
    channel.on('e2ee:key_revoked', (payload) => {
      const data = payload as { user_id: string; key_id: string; revoked_at: string };
      logger.log('E2EE key revoked event received:', data);
      useE2EEStore.getState().handleKeyRevoked(data.user_id, data.key_id);
    });

    channel.on('friend_request', (payload) => {
      logger.log('Friend request received:', payload);
    });

    channel.on('message_preview', (payload) => {
      logger.log('Message preview:', payload);
    });

    channel.on('conversation_created', (payload) => {
      logger.log('New conversation created:', payload);
      const data = payload as { conversation: Record<string, unknown> };
      if (data.conversation) {
        const normalized = normalizeConversation(data.conversation) as unknown as Conversation;
        logger.debug('Normalized conversation:', normalized);
        useChatStore.getState().addConversation(normalized);
      }
    });

    channel.on('conversation_updated', (payload) => {
      logger.log('Conversation updated:', payload);
      const data = payload as { conversation: Partial<Conversation> & { id: string } };
      if (data.conversation?.id) {
        useChatStore.getState().updateConversation(data.conversation);
      }
    });

    channel.on('contact_presence', (payload) => {
      const data = payload as { contacts?: Record<string, { online?: boolean }> };
      const contacts = data.contacts || {};
      const onlineSet = new Set<string>();

      Object.entries(contacts).forEach(([uid, status]) => {
        if (status?.online) onlineSet.add(uid);
      });

      this.onlineUsers.set('lobby', onlineSet);
      logger.log('Contact presence snapshot:', onlineSet.size);
    });

    channel.on('contact_status_changed', (payload) => {
      const data = payload as { user_id: string; online: boolean };
      const onlineSet = this.onlineUsers.get('lobby') || new Set<string>();

      if (data.online) {
        onlineSet.add(data.user_id);
        this.notifyStatusChange('lobby', data.user_id, true);
      } else {
        onlineSet.delete(data.user_id);
        this.notifyStatusChange('lobby', data.user_id, false);
      }

      this.onlineUsers.set('lobby', onlineSet);
    });

    // Incoming WebRTC calls
    channel.on('incoming_call', (payload) => {
      logger.log('Incoming call received:', payload);
      const data = payload as { room_id: string; caller_id: string; type: 'audio' | 'video' };

      const callerUser = useChatStore
        .getState()
        .conversations.flatMap((conv) => conv.participants)
        .find((p) => p.userId === data.caller_id);

      const incomingCall: IncomingCall = {
        roomId: data.room_id,
        callerId: data.caller_id,
        callerName: callerUser?.user?.username || callerUser?.user?.displayName || 'Unknown User',
        callerAvatar: callerUser?.user?.avatarUrl || null,
        type: data.type,
        timestamp: Date.now(),
      };

      useIncomingCallStore.getState().setIncomingCall(incomingCall);
    });

    channel
      .join()
      .receive('ok', () => logger.log(`Joined user channel: ${topic}`))
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join user channel: ${topic}`, resp);
        this.channels.delete(topic);
      });

    this.channels.set(topic, channel);
    return channel;
  }

  leaveUserChannel(userId: string) {
    const topic = `user:${userId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  // ── Presence Lobby ────────────────────────────────────────────────

  joinPresenceLobby(): Channel | null {
    const topic = 'presence:lobby';

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    if (!this.socket) {
      logger.warn('Cannot join presence lobby: socket not connected');
      return null;
    }

    const channel = this.socket.channel(topic, { include_contact_presence: true });
    const presence = new Presence(channel);

    presence.onSync(() => {
      const onlineFriends = new Set<string>();
      presence.list((id: string) => {
        onlineFriends.add(id);
        return id;
      });
      this.onlineUsers.set('lobby', onlineFriends);
      logger.log('Presence sync: online friends count =', onlineFriends.size);
    });

    channel.on('friend_online', (payload: unknown) => {
      const data = payload as { user_id: string; status: string };
      this.onlineUsers.get('lobby')?.add(data.user_id);
      this.notifyStatusChange('lobby', data.user_id, true);
      logger.log('Friend came online:', data.user_id);
    });

    channel.on('friend_offline', (payload: unknown) => {
      const data = payload as { user_id: string; last_seen?: string };
      this.onlineUsers.get('lobby')?.delete(data.user_id);
      this.notifyStatusChange('lobby', data.user_id, false);
      logger.log('Friend went offline:', data.user_id);
    });

    const handleStatusUpdate = (payload: unknown) => {
      const data = payload as { user_id: string; status: string };
      logger.log('Friend status update:', data.user_id, '->', data.status);
    };

    channel.on('status_update', handleStatusUpdate);
    channel.on('friend_status_changed', handleStatusUpdate);

    channel
      .join()
      .receive('ok', () => {
        logger.log('Joined presence lobby');
        this.onlineUsers.set('lobby', new Set());
      })
      .receive('error', (resp: unknown) => {
        logger.error('Failed to join presence lobby:', resp);
        this.channels.delete(topic);
      });

    this.channels.set(topic, channel);
    this.presences.set(topic, presence);
    return channel;
  }

  leavePresenceLobby() {
    const topic = 'presence:lobby';
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
      this.presences.delete(topic);
      this.onlineUsers.delete('lobby');
    }
  }

  // ── Presence Queries ──────────────────────────────────────────────

  isFriendOnline(userId: string): boolean {
    const lobbyUsers = this.onlineUsers.get('lobby');
    if (!lobbyUsers) return false;
    if (lobbyUsers.has(userId)) return true;

    const userIdStr = String(userId);
    for (const id of lobbyUsers) {
      if (String(id) === userIdStr) return true;
    }
    return false;
  }

  getOnlineFriends(): string[] {
    return Array.from(this.onlineUsers.get('lobby') || []);
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
    return Array.from(this.onlineUsers.get(conversationId) || []);
  }

  isUserOnline(conversationId: string, userId: string): boolean {
    const onlineSet = this.onlineUsers.get(conversationId);
    if (!onlineSet || !userId) return false;
    if (onlineSet.has(userId)) return true;

    const userIdStr = String(userId);
    for (const id of onlineSet) {
      if (String(id) === userIdStr) return true;
    }
    return false;
  }

  getAllOnlineStatuses(): Map<string, Set<string>> {
    return new Map(this.onlineUsers);
  }

  // ── Conversation Channels ────────────────────────────────────────

  joinConversation(conversationId: string): Channel | null {
    const topic = `conversation:${conversationId}`;

    // Debounce rapid join attempts
    const now = Date.now();
    const lastAttempt = this.lastJoinAttempts.get(topic) || 0;
    if (now - lastAttempt < this.JOIN_DEBOUNCE_MS) {
      logger.log(`Debouncing join for ${topic}`);
      return this.channels.get(topic) || null;
    }

    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') {
        return existingChannel;
      }
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      this.onlineUsers.delete(conversationId);
    }

    if (!this.socket) {
      logger.warn('Cannot join conversation: socket not connected');
      this.connect().then(() => {
        if (this.socket && !this.channels.has(topic)) {
          this.joinConversation(conversationId);
        }
      });
      return null;
    }

    if (!this.socket.isConnected()) {
      logger.warn('Socket exists but not connected, waiting...');
      return null;
    }

    this.lastJoinAttempts.set(topic, now);
    const channel = this.socket.channel(topic, {});
    this.channels.set(topic, channel);

    if (!this.channelHandlersSetUp.has(topic)) {
      this.channelHandlersSetUp.add(topic);

      const presence = new Presence(channel);
      this.presences.set(topic, presence);
      this.onlineUsers.set(conversationId, new Set());

      presence.onSync(() => {
        const onlineSet = new Set<string>();
        presence.list((id: string) => {
          onlineSet.add(id);
          return id;
        });

        const previousSet = this.onlineUsers.get(conversationId) || new Set();
        onlineSet.forEach((uid) => {
          if (!previousSet.has(uid)) this.notifyStatusChange(conversationId, uid, true);
        });
        previousSet.forEach((uid) => {
          if (!onlineSet.has(uid)) this.notifyStatusChange(conversationId, uid, false);
        });

        this.onlineUsers.set(conversationId, onlineSet);
        if (
          import.meta.env.DEV &&
          (previousSet.size !== onlineSet.size ||
            Array.from(previousSet).some((u) => !onlineSet.has(u)))
        ) {
          logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
        }
      });

      presence.onJoin((id: string) => {
        this.onlineUsers.get(conversationId)?.add(id);
      });

      presence.onLeave(() => {
        // Handled by onSync
      });

      channel.on('new_message', (payload) => {
        const data = payload as { message: Record<string, unknown> };
        const normalized = normalizeMessage(data.message) as unknown as Message;
        logger.log('Received new_message:', normalized);
        useChatStore.getState().addMessage(normalized);
      });

      channel.on('message_updated', (payload) => {
        const data = payload as { message: Record<string, unknown> };
        const normalized = normalizeMessage(data.message) as unknown as Message;
        useChatStore.getState().updateMessage(normalized);
      });

      channel.on('message_deleted', (payload) => {
        const data = payload as { message_id: string };
        useChatStore.getState().removeMessage(data.message_id, conversationId);
      });

      channel.on('typing', (payload) => {
        const data = payload as { user_id: string; is_typing: boolean; started_at?: string };
        useChatStore
          .getState()
          .setTypingUser(conversationId, data.user_id, data.is_typing, data.started_at);
      });

      channel.on('presence_state', (state) => logger.log('Presence state:', state));
      channel.on('presence_diff', (diff) => logger.log('Presence diff:', diff));

      channel.on('reaction_added', (payload) => {
        const data = payload as {
          message_id: string;
          user_id: string;
          emoji: string;
          user?: { id: string; username: string; display_name?: string; avatar_url?: string };
        };
        useChatStore
          .getState()
          .addReactionToMessage(data.message_id, data.emoji, data.user_id, data.user?.username);
      });

      channel.on('reaction_removed', (payload) => {
        const data = payload as { message_id: string; user_id: string; emoji: string };
        useChatStore
          .getState()
          .removeReactionFromMessage(data.message_id, data.emoji, data.user_id);
      });
    }

    channel
      .join()
      .receive('ok', () => logger.log(`Joined conversation ${conversationId}`))
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join conversation ${conversationId}:`, resp);
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.lastJoinAttempts.delete(topic);
      });

    return channel;
  }

  leaveConversation(conversationId: string) {
    const topic = `conversation:${conversationId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      logger.log(`Leaving conversation: ${topic}`);
      channel.leave();
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      this.onlineUsers.delete(conversationId);
      this.lastJoinAttempts.delete(topic);
    }
  }

  // ── Group Channels ────────────────────────────────────────────────

  joinGroupChannel(channelId: string): Channel | null {
    const topic = `channel:${channelId}`;

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    if (!this.socket) {
      logger.warn('Cannot join group channel: socket not connected');
      this.connect();
      return null;
    }

    const channel = this.socket.channel(topic, {});

    channel.on('new_message', (payload) => {
      const data = payload as { message: Record<string, unknown> };
      const normalized = normalizeMessage(data.message) as unknown as ChannelMessage;
      useGroupStore.getState().addChannelMessage(normalized);
    });

    channel.on('message_updated', (payload) => {
      const data = payload as { message: Record<string, unknown> };
      const normalized = normalizeMessage(data.message) as unknown as ChannelMessage;
      useGroupStore.getState().updateChannelMessage(normalized);
    });

    channel.on('message_deleted', (payload) => {
      const data = payload as { message_id: string };
      useGroupStore.getState().removeChannelMessage(data.message_id, channelId);
    });

    channel.on('typing', (payload) => {
      const data = payload as { user_id: string; is_typing: boolean };
      useGroupStore.getState().setTypingUser(channelId, data.user_id, data.is_typing);
    });

    channel.on('presence_state', (state) => logger.log('Channel presence state:', state));
    channel.on('presence_diff', (diff) => logger.log('Channel presence diff:', diff));

    channel
      .join()
      .receive('ok', () => logger.log(`Joined channel ${channelId}`))
      .receive('error', (resp: unknown) =>
        logger.error(`Failed to join channel ${channelId}:`, resp)
      );

    this.channels.set(topic, channel);
    return channel;
  }

  leaveGroupChannel(channelId: string) {
    const topic = `channel:${channelId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
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
