import { Socket, Channel, Presence } from 'phoenix';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message, Conversation } from '@/stores/chatStore';
import { useGroupStore, ChannelMessage } from '@/stores/groupStore';
import { useE2EEStore } from '@/lib/crypto/e2eeStore';
import { useIncomingCallStore, type IncomingCall } from '@/stores/incomingCallStore';
import { socketLogger as logger } from './logger';
import { normalizeMessage, normalizeConversation } from './apiUtils';

// ============================================================================
// Forum/Thread WebSocket Types
// ============================================================================

export interface ForumThreadPayload {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  author_username: string;
  author_avatar?: string;
  preview?: string;
  created_at: string;
  is_pinned: boolean;
  is_locked: boolean;
}

export interface ForumUserPayload {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface ForumStatsPayload {
  member_count: number;
  post_count: number;
  thread_count: number;
  online_count?: number;
}

export interface ForumPresenceMeta {
  username: string;
  display_name?: string;
  avatar_url?: string;
  online_at: string;
  is_member: boolean;
}

export interface ForumPresenceMember {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  online_at: string;
  is_member: boolean;
}

export interface ThreadCommentPayload {
  id: string;
  content: string;
  author_id: string;
  author_username?: string;
  author_display_name?: string;
  author_avatar?: string;
  parent_id?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
  updated_at?: string;
}

export interface ThreadVotePayload {
  thread_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
  view_count?: number;
  comment_count?: number;
  online_count?: number;
}

export interface CommentVotePayload {
  comment_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
}

export interface ThreadTypingPayload {
  user_id: string;
  username: string;
  display_name?: string;
  is_typing: boolean;
  started_at?: string;
}

export interface ThreadPollOption {
  id: string;
  text: string;
  vote_count: number;
}

export interface ThreadPollData {
  id: string;
  question: string;
  options: ThreadPollOption[];
  total_votes: number;
  ends_at?: string;
}

export interface ThreadPollPayload {
  thread_id: string;
  poll: ThreadPollData;
}

export interface ThreadPresenceMeta {
  username: string;
  display_name?: string;
  avatar_url?: string;
  typing: boolean;
}

export interface ThreadViewerPayload {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  typing: boolean;
}

// Build WebSocket URL based on environment
// Empty string means use current host with /socket path (for Vercel rewrites)
function getSocketUrl(): string {
  const envUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_WS_URL;

  // If explicitly set (not undefined), use it
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }

  // For production with Vercel rewrites, build URL from current location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/socket`;
  }

  // Fallback for SSR or dev
  return 'ws://localhost:4000/socket';
}

const SOCKET_URL = getSocketUrl();

// Debug logging for development
console.log('[Socket] Configured URL:', SOCKET_URL);
console.log('[Socket] VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('[Socket] VITE_API_URL:', import.meta.env.VITE_API_URL);

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set<userId>
  private reconnectTimer: number | null = null;
  private statusListeners: Set<
    (conversationId: string, userId: string, isOnline: boolean) => void
  > = new Set();
  private connectionPromise: Promise<void> | null = null;
  // Track last join attempt timestamp per channel to prevent rapid rejoins
  private lastJoinAttempts: Map<string, number> = new Map();
  // Track which channels have handlers set up
  private channelHandlersSetUp: Set<string> = new Set();
  // Minimum time between join attempts (ms) - prevents join/leave loops
  private readonly JOIN_DEBOUNCE_MS = 1000;

  connect(): Promise<void> {
    // Return existing promise if connection is in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = useAuthStore.getState().token;
    console.log('[Socket] connect() called, token exists:', !!token);
    if (!token) {
      logger.warn('Cannot connect to socket: no auth token');
      return Promise.resolve();
    }

    if (this.socket?.isConnected()) {
      console.log('[Socket] Already connected');
      return Promise.resolve();
    }

    console.log('[Socket] Connecting to:', SOCKET_URL);
    this.connectionPromise = new Promise((resolve) => {
      this.socket = new Socket(SOCKET_URL, {
        params: { token },
        reconnectAfterMs: (tries: number) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
          return Math.min(1000 * Math.pow(2, tries - 1), 30000);
        },
        heartbeatIntervalMs: 30000,
      });

      this.socket.onOpen(() => {
        logger.log('Socket connected');
        console.log('[Socket] ✅ Connected successfully to:', SOCKET_URL);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.connectionPromise = null;
        resolve();
      });

      this.socket.onClose(() => {
        logger.log('Socket disconnected');
        console.log('[Socket] ⚠️ Disconnected');
        this.connectionPromise = null;
      });

      this.socket.onError((error: unknown) => {
        logger.error('Socket error:', error);
        console.log('[Socket] ❌ Error:', error);
        this.connectionPromise = null;
        resolve(); // Resolve anyway to not block
      });

      this.socket.connect();
    });

    return this.connectionPromise;
  }

  disconnect() {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.presences.clear();
    this.onlineUsers.clear();
    this.channelHandlersSetUp.clear();
    this.lastJoinAttempts.clear();
    this.socket?.disconnect();
    this.socket = null;
    this.connectionPromise = null;
  }

  /**
   * Reconnect with a fresh token after token refresh.
   * This is called when the API interceptor refreshes the access token.
   *
   * @returns Promise that resolves when reconnection is complete
   */
  async reconnectWithNewToken(): Promise<void> {
    logger.log('Reconnecting socket with new token...');

    // Store current channel topics to rejoin after reconnect
    const channelTopics = Array.from(this.channels.keys());

    // Disconnect current socket
    this.disconnect();

    // Wait a moment for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Reconnect with fresh token from store
    await this.connect();

    // Rejoin essential channels (user channel and presence lobby)
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      this.joinUserChannel(userId);
      this.joinPresenceLobby();
    }

    logger.log(`Socket reconnected. Previous channels: ${channelTopics.length}`);
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }

  /**
   * Get the underlying Phoenix socket instance.
   * Used by WebRTC and other services that need direct socket access.
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Join the user's personal channel for receiving targeted notifications.
   *
   * This channel receives:
   * - E2EE key revocation events (critical for security)
   * - Friend request notifications
   * - Message previews for push notifications
   * - Account state changes
   *
   * @param userId - Current user's ID
   * @returns Channel instance or null if unable to join
   */
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

    // Handle E2EE key revocation events - CRITICAL for Forward Secrecy
    channel.on('e2ee:key_revoked', (payload) => {
      const data = payload as { user_id: string; key_id: string; revoked_at: string };
      logger.log('E2EE key revoked event received:', data);
      useE2EEStore.getState().handleKeyRevoked(data.user_id, data.key_id);
    });

    // Handle friend request notifications
    channel.on('friend_request', (payload) => {
      logger.log('Friend request received:', payload);
      // Could dispatch to a notification store here
    });

    // Handle message previews (for notifications when app is in background)
    channel.on('message_preview', (payload) => {
      logger.log('Message preview:', payload);
    });

    // Handle new conversation created (real-time sync for multi-device)
    channel.on('conversation_created', (payload) => {
      logger.log('New conversation created:', payload);
      console.log('[Socket] 🆕 conversation_created event:', payload);
      const data = payload as { conversation: Record<string, unknown> };
      if (data.conversation) {
        // Normalize the conversation data before adding to store
        const normalized = normalizeConversation(data.conversation) as unknown as Conversation;
        console.log('[Socket] Normalized conversation:', normalized);
        useChatStore.getState().addConversation(normalized);
      }
    });

    // Handle conversation updates (new messages, unread counts, etc.)
    channel.on('conversation_updated', (payload) => {
      logger.log('Conversation updated:', payload);
      const data = payload as { conversation: Partial<Conversation> & { id: string } };
      if (data.conversation?.id) {
        useChatStore.getState().updateConversation(data.conversation);
      }
    });

    // Handle initial contact presence snapshot
    channel.on('contact_presence', (payload) => {
      const data = payload as { contacts?: Record<string, { online?: boolean }> };
      const contacts = data.contacts || {};
      const onlineSet = new Set<string>();

      Object.entries(contacts).forEach(([userId, status]) => {
        if (status?.online) {
          onlineSet.add(userId);
        }
      });

      this.onlineUsers.set('lobby', onlineSet);
      logger.log('Contact presence snapshot:', onlineSet.size);
    });

    // Handle contact presence updates (friend online/offline)
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

    // Handle incoming WebRTC calls
    channel.on('incoming_call', (payload) => {
      logger.log('Incoming call received:', payload);
      console.log('[Socket] 📞 Incoming call:', payload);
      const data = payload as { room_id: string; caller_id: string; type: 'audio' | 'video' };

      // Fetch caller info from auth store or friends list
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
      .receive('ok', () => {
        logger.log(`Joined user channel: ${topic}`);
        console.log(`[Socket] ✅ Joined user channel: ${topic}`);
      })
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join user channel: ${topic}`, resp);
        console.log(`[Socket] ❌ Failed to join user channel: ${topic}`, resp);
        this.channels.delete(topic);
      });

    this.channels.set(topic, channel);
    return channel;
  }

  /**
   * Join the global presence lobby for friend online/offline status.
   *
   * This channel receives:
   * - presence_state: Initial list of online friends
   * - friend_online: When a friend comes online
   * - friend_offline: When a friend goes offline
   * - status_update: When a friend changes their status (online/away/busy)
   *
   * @returns Channel instance or null if unable to join
   */
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

    // Handle initial presence state
    presence.onSync(() => {
      const onlineFriends = new Set<string>();
      presence.list((id: string) => {
        onlineFriends.add(id);
        return id;
      });

      // Store in a global "lobby" key
      this.onlineUsers.set('lobby', onlineFriends);
      logger.log('Presence sync: online friends count =', onlineFriends.size);
    });

    // Handle friend coming online
    channel.on('friend_online', (payload: unknown) => {
      const data = payload as { user_id: string; status: string };
      this.onlineUsers.get('lobby')?.add(data.user_id);
      // Notify all status listeners
      this.notifyStatusChange('lobby', data.user_id, true);
      logger.log('Friend came online:', data.user_id);
    });

    // Handle friend going offline
    channel.on('friend_offline', (payload: unknown) => {
      const data = payload as { user_id: string; last_seen?: string };
      this.onlineUsers.get('lobby')?.delete(data.user_id);
      this.notifyStatusChange('lobby', data.user_id, false);
      logger.log('Friend went offline:', data.user_id);
    });

    // Handle status updates (online -> away -> busy -> etc.)
    const handleStatusUpdate = (payload: unknown) => {
      const data = payload as { user_id: string; status: string };
      logger.log('Friend status update:', data.user_id, '->', data.status);
      // Status listeners can query the status via API if needed
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

  /**
   * Check if a friend is online (global presence check).
   *
   * @param userId - Friend's user ID
   * @returns true if friend is online in the presence lobby
   */
  isFriendOnline(userId: string): boolean {
    const lobbyUsers = this.onlineUsers.get('lobby');
    if (!lobbyUsers) return false;

    if (lobbyUsers.has(userId)) return true;

    // String comparison fallback
    const userIdStr = String(userId);
    for (const id of lobbyUsers) {
      if (String(id) === userIdStr) return true;
    }

    return false;
  }

  /**
   * Get list of all online friends.
   *
   * @returns Array of online friend user IDs
   */
  getOnlineFriends(): string[] {
    return Array.from(this.onlineUsers.get('lobby') || []);
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

  leaveUserChannel(userId: string) {
    const topic = `user:${userId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  // Subscribe to user status changes
  onStatusChange(
    callback: (conversationId: string, userId: string, isOnline: boolean) => void
  ): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // Notify status change listeners
  private notifyStatusChange(conversationId: string, userId: string, isOnline: boolean) {
    this.statusListeners.forEach((callback) => callback(conversationId, userId, isOnline));
  }

  // Get online users for a conversation
  getOnlineUsers(conversationId: string): string[] {
    return Array.from(this.onlineUsers.get(conversationId) || []);
  }

  // Check if user is online in any conversation
  // Uses string coercion to ensure consistent comparison regardless of ID format
  isUserOnline(conversationId: string, userId: string): boolean {
    const onlineSet = this.onlineUsers.get(conversationId);
    if (!onlineSet || !userId) return false;

    // Direct lookup first (most common case)
    if (onlineSet.has(userId)) return true;

    // Fallback: Convert both to strings and compare (handles potential type mismatches)
    const userIdStr = String(userId);
    for (const id of onlineSet) {
      if (String(id) === userIdStr) return true;
    }

    return false;
  }

  /**
   * Join a conversation channel (DMs) with comprehensive lifecycle management.
   *
   * Architectural improvements:
   * - Debounces rapid join attempts to prevent join/leave loops
   * - Validates socket connection state before attempting join
   * - Reuses existing healthy channels to minimize reconnection overhead
   * - Cleans up stale channels in bad states (closed/errored)
   * - Sets up presence tracking once per channel to prevent duplicate handlers
   * - Implements idempotent handler registration
   *
   * @param conversationId - Conversation ID to join
   * @returns Channel instance or null if unable to join
   */
  joinConversation(conversationId: string): Channel | null {
    const topic = `conversation:${conversationId}`;

    // Debouncing: Prevent rapid join attempts (fixes join/leave loops)
    const now = Date.now();
    const lastAttempt = this.lastJoinAttempts.get(topic) || 0;
    const timeSinceLastAttempt = now - lastAttempt;

    if (timeSinceLastAttempt < this.JOIN_DEBOUNCE_MS) {
      logger.log(
        `Debouncing join attempt for ${topic}, last attempt was ${timeSinceLastAttempt}ms ago`
      );
      // Return existing channel if it exists, otherwise null
      return this.channels.get(topic) || null;
    }

    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      // Channel already exists - check its state before returning
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') {
        logger.log(`Reusing existing channel ${topic} in state: ${state}`);
        return existingChannel;
      }
      // Channel exists but is in a bad state (closed, errored, leaving)
      logger.warn(`Channel ${topic} in bad state: ${state}, recreating`);
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      this.onlineUsers.delete(conversationId);
    }

    if (!this.socket) {
      logger.warn('Cannot join conversation: socket not connected, attempting to connect');
      // Attempt to reconnect - this is async but we return null for now
      // Caller should wait for socket to be ready via connect()
      this.connect().then(() => {
        if (this.socket && !this.channels.has(topic)) {
          this.joinConversation(conversationId);
        }
      });
      return null;
    }

    // Check if socket is actually connected
    if (!this.socket.isConnected()) {
      logger.warn('Socket exists but not connected, waiting...');
      return null;
    }

    // Update join attempt timestamp BEFORE creating channel
    this.lastJoinAttempts.set(topic, now);

    const channel = this.socket.channel(topic, {});
    this.channels.set(topic, channel);

    // Set up handlers only once per channel
    if (!this.channelHandlersSetUp.has(topic)) {
      this.channelHandlersSetUp.add(topic);

      // Set up presence tracking for this channel
      const presence = new Presence(channel);
      this.presences.set(topic, presence);

      // Initialize online users set for this conversation
      this.onlineUsers.set(conversationId, new Set());

      // Handle presence sync (initial state)
      presence.onSync(() => {
        const onlineSet = new Set<string>();
        presence.list((id: string) => {
          onlineSet.add(id);
          return id;
        });

        // Compare with previous state and notify changes
        const previousSet = this.onlineUsers.get(conversationId) || new Set();
        onlineSet.forEach((userId) => {
          if (!previousSet.has(userId)) {
            this.notifyStatusChange(conversationId, userId, true);
          }
        });
        previousSet.forEach((userId) => {
          if (!onlineSet.has(userId)) {
            this.notifyStatusChange(conversationId, userId, false);
          }
        });

        this.onlineUsers.set(conversationId, onlineSet);
        // Only log if there's a meaningful change
        if (
          import.meta.env.DEV &&
          (previousSet.size !== onlineSet.size ||
            Array.from(previousSet).some((u) => !onlineSet.has(u)))
        ) {
          logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
        }
      });

      // Note: onJoin/onLeave are called for every presence update (including typing changes)
      // We rely primarily on onSync for the authoritative state
      presence.onJoin((id: string) => {
        // Don't log - too noisy due to presence updates
        this.onlineUsers.get(conversationId)?.add(id);
        // Status changes are handled by onSync
      });

      presence.onLeave(() => {
        // Status changes are handled by onSync
        // onLeave fires for every presence update, not just when user truly leaves
      });

      channel.on('new_message', (payload) => {
        logger.log('Received new_message event:', payload);
        const data = payload as { message: Record<string, unknown> };
        const normalized = normalizeMessage(data.message) as unknown as Message;
        logger.log('Normalized message:', normalized);
        useChatStore.getState().addMessage(normalized);
      });

      channel.on('message_updated', (payload) => {
        logger.log('Received message_updated event:', payload);
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

      channel.on('presence_state', (state) => {
        logger.log('Presence state:', state);
      });

      channel.on('presence_diff', (diff) => {
        logger.log('Presence diff:', diff);
      });

      // Handle real-time reaction updates
      channel.on('reaction_added', (payload) => {
        logger.log('Received reaction_added event:', payload);
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
        logger.log('Received reaction_removed event:', payload);
        const data = payload as {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        useChatStore
          .getState()
          .removeReactionFromMessage(data.message_id, data.emoji, data.user_id);
      });
    }

    channel
      .join()
      .receive('ok', () => {
        logger.log(`Joined conversation ${conversationId}`);
      })
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join conversation ${conversationId}:`, resp);
        // Clean up on failure
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.lastJoinAttempts.delete(topic); // Allow retry after error
      });

    return channel;
  }

  /**
   * Leave a conversation channel and clean up all associated state.
   *
   * Properly cleans up:
   * - Channel connection
   * - Presence tracking
   * - Handler registration state
   * - Online user tracking
   * - Join attempt tracking
   *
   * @param conversationId - Conversation ID to leave
   */
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

  // Join a group channel
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

    channel.on('presence_state', (state) => {
      logger.log('Channel presence state:', state);
    });

    channel.on('presence_diff', (diff) => {
      logger.log('Channel presence diff:', diff);
    });

    channel
      .join()
      .receive('ok', () => {
        logger.log(`Joined channel ${channelId}`);
      })
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join channel ${channelId}:`, resp);
      });

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

  // ============================================================================
  // Forum Channels
  // ============================================================================

  /**
   * Forum event callbacks interface
   */
  private forumCallbacks: Map<
    string,
    {
      onNewThread?: (thread: ForumThreadPayload) => void;
      onThreadPinned?: (data: { thread_id: string; is_pinned: boolean }) => void;
      onThreadLocked?: (data: { thread_id: string; is_locked: boolean }) => void;
      onThreadDeleted?: (data: { thread_id: string }) => void;
      onMemberJoined?: (user: ForumUserPayload) => void;
      onMemberLeft?: (data: { user_id: string }) => void;
      onStatsUpdate?: (stats: ForumStatsPayload) => void;
      onPresenceSync?: (members: ForumPresenceMember[]) => void;
    }
  > = new Map();

  /**
   * Thread event callbacks interface
   */
  private threadCallbacks: Map<
    string,
    {
      onNewComment?: (comment: ThreadCommentPayload) => void;
      onCommentEdited?: (comment: ThreadCommentPayload) => void;
      onCommentDeleted?: (data: { comment_id: string }) => void;
      onVoteChanged?: (data: ThreadVotePayload) => void;
      onCommentVoteChanged?: (data: CommentVotePayload) => void;
      onTyping?: (data: ThreadTypingPayload) => void;
      onPollUpdated?: (data: ThreadPollPayload) => void;
      onThreadStatusChanged?: (data: {
        thread_id: string;
        is_locked: boolean;
        is_pinned: boolean;
      }) => void;
      onPresenceSync?: (viewers: ThreadViewerPayload[]) => void;
    }
  > = new Map();

  /**
   * Join a forum channel for real-time updates.
   *
   * Receives:
   * - new_thread: When a new thread is posted
   * - thread_pinned: When a thread is pinned/unpinned
   * - thread_locked: When a thread is locked/unlocked
   * - thread_deleted: When a thread is deleted
   * - member_joined: When a new member joins
   * - member_left: When a member leaves
   * - stats_update: Forum stats changes
   * - presence_state: Who's viewing the forum
   *
   * @param forumId - Forum ID to join
   * @param callbacks - Optional callbacks for forum events
   * @returns Channel instance or null if unable to join
   */
  joinForum(
    forumId: string,
    callbacks?: {
      onNewThread?: (thread: ForumThreadPayload) => void;
      onThreadPinned?: (data: { thread_id: string; is_pinned: boolean }) => void;
      onThreadLocked?: (data: { thread_id: string; is_locked: boolean }) => void;
      onThreadDeleted?: (data: { thread_id: string }) => void;
      onMemberJoined?: (user: ForumUserPayload) => void;
      onMemberLeft?: (data: { user_id: string }) => void;
      onStatsUpdate?: (stats: ForumStatsPayload) => void;
      onPresenceSync?: (members: ForumPresenceMember[]) => void;
    }
  ): Channel | null {
    const topic = `forum:${forumId}`;

    // Store callbacks for this forum
    if (callbacks) {
      this.forumCallbacks.set(forumId, callbacks);
    }

    // Return existing channel if already joined
    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') {
        return existingChannel;
      }
      // Clean up bad state channel
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

    // Set up handlers only once
    if (!this.channelHandlersSetUp.has(topic)) {
      this.channelHandlersSetUp.add(topic);

      // Set up presence tracking
      const presence = new Presence(channel);
      this.presences.set(topic, presence);

      presence.onSync(() => {
        const members: ForumPresenceMember[] = [];
        presence.list((userId: string, pres: unknown) => {
          const { metas } = pres as { metas: ForumPresenceMeta[] };
          const meta = metas?.[0];
          if (meta) {
            members.push({
              user_id: userId,
              username: meta.username,
              display_name: meta.display_name,
              avatar_url: meta.avatar_url,
              online_at: meta.online_at,
              is_member: meta.is_member,
            });
          }
          return userId;
        });

        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onPresenceSync?.(members);
      });

      // Forum event handlers
      channel.on('new_thread', (payload) => {
        const data = payload as { thread: ForumThreadPayload };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onNewThread?.(data.thread);
      });

      channel.on('thread_pinned', (payload) => {
        const data = payload as { thread_id: string; is_pinned: boolean };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onThreadPinned?.(data);
      });

      channel.on('thread_locked', (payload) => {
        const data = payload as { thread_id: string; is_locked: boolean };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onThreadLocked?.(data);
      });

      channel.on('thread_deleted', (payload) => {
        const data = payload as { thread_id: string };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onThreadDeleted?.(data);
      });

      channel.on('member_joined', (payload) => {
        const data = payload as { user: ForumUserPayload };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onMemberJoined?.(data.user);
      });

      channel.on('member_left', (payload) => {
        const data = payload as { user_id: string };
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onMemberLeft?.(data);
      });

      channel.on('stats_update', (payload) => {
        const data = payload as ForumStatsPayload;
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onStatsUpdate?.(data);
      });

      channel.on('forum_stats', (payload) => {
        const data = payload as ForumStatsPayload;
        const cbs = this.forumCallbacks.get(forumId);
        cbs?.onStatsUpdate?.(data);
      });
    }

    channel
      .join()
      .receive('ok', () => {
        logger.log(`Joined forum channel: ${forumId}`);
      })
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join forum channel ${forumId}:`, resp);
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.forumCallbacks.delete(forumId);
      });

    return channel;
  }

  /**
   * Leave a forum channel and clean up.
   */
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

  /**
   * Subscribe to a forum via WebSocket.
   */
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

  /**
   * Unsubscribe from a forum via WebSocket.
   */
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

  // ============================================================================
  // Thread Channels
  // ============================================================================

  /**
   * Join a thread channel for real-time updates.
   *
   * Receives:
   * - new_comment: When a new comment is posted
   * - comment_edited: When a comment is edited
   * - comment_deleted: When a comment is deleted
   * - vote_changed: When thread votes change
   * - comment_vote_changed: When comment votes change
   * - typing: When someone is typing a comment
   * - poll_updated: When poll votes change
   * - thread_status_changed: When thread is locked/pinned
   * - presence_state: Who's viewing the thread
   *
   * @param threadId - Thread ID to join
   * @param callbacks - Optional callbacks for thread events
   * @returns Channel instance or null if unable to join
   */
  joinThread(
    threadId: string,
    callbacks?: {
      onNewComment?: (comment: ThreadCommentPayload) => void;
      onCommentEdited?: (comment: ThreadCommentPayload) => void;
      onCommentDeleted?: (data: { comment_id: string }) => void;
      onVoteChanged?: (data: ThreadVotePayload) => void;
      onCommentVoteChanged?: (data: CommentVotePayload) => void;
      onTyping?: (data: ThreadTypingPayload) => void;
      onPollUpdated?: (data: ThreadPollPayload) => void;
      onThreadStatusChanged?: (data: {
        thread_id: string;
        is_locked: boolean;
        is_pinned: boolean;
      }) => void;
      onPresenceSync?: (viewers: ThreadViewerPayload[]) => void;
    }
  ): Channel | null {
    const topic = `thread:${threadId}`;

    // Store callbacks for this thread
    if (callbacks) {
      this.threadCallbacks.set(threadId, callbacks);
    }

    // Return existing channel if already joined
    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      const state = existingChannel.state;
      if (state === 'joined' || state === 'joining') {
        return existingChannel;
      }
      // Clean up bad state channel
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

    // Set up handlers only once
    if (!this.channelHandlersSetUp.has(topic)) {
      this.channelHandlersSetUp.add(topic);

      // Set up presence tracking
      const presence = new Presence(channel);
      this.presences.set(topic, presence);

      presence.onSync(() => {
        const viewers: ThreadViewerPayload[] = [];
        presence.list((userId: string, pres: unknown) => {
          const { metas } = pres as { metas: ThreadPresenceMeta[] };
          const meta = metas?.[0];
          if (meta) {
            viewers.push({
              user_id: userId,
              username: meta.username,
              display_name: meta.display_name,
              avatar_url: meta.avatar_url,
              typing: meta.typing,
            });
          }
          return userId;
        });

        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onPresenceSync?.(viewers);
      });

      // Thread event handlers
      channel.on('new_comment', (payload) => {
        const data = payload as { comment: ThreadCommentPayload };
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onNewComment?.(data.comment);
      });

      channel.on('comment_edited', (payload) => {
        const data = payload as { comment: ThreadCommentPayload };
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onCommentEdited?.(data.comment);
      });

      channel.on('comment_deleted', (payload) => {
        const data = payload as { comment_id: string };
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onCommentDeleted?.(data);
      });

      channel.on('vote_changed', (payload) => {
        const data = payload as ThreadVotePayload;
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onVoteChanged?.(data);
      });

      channel.on('comment_vote_changed', (payload) => {
        const data = payload as CommentVotePayload;
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onCommentVoteChanged?.(data);
      });

      channel.on('typing', (payload) => {
        const data = payload as ThreadTypingPayload;
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onTyping?.(data);
      });

      channel.on('poll_updated', (payload) => {
        const data = payload as ThreadPollPayload;
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onPollUpdated?.(data);
      });

      channel.on('thread_status_changed', (payload) => {
        const data = payload as { thread_id: string; is_locked: boolean; is_pinned: boolean };
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onThreadStatusChanged?.(data);
      });

      channel.on('thread_stats', (payload) => {
        const data = payload as ThreadVotePayload;
        const cbs = this.threadCallbacks.get(threadId);
        cbs?.onVoteChanged?.(data);
      });
    }

    channel
      .join()
      .receive('ok', () => {
        logger.log(`Joined thread channel: ${threadId}`);
      })
      .receive('error', (resp: unknown) => {
        logger.error(`Failed to join thread channel ${threadId}:`, resp);
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.threadCallbacks.delete(threadId);
      });

    return channel;
  }

  /**
   * Leave a thread channel and clean up.
   */
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

  /**
   * Vote on a thread via WebSocket for instant feedback.
   */
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

  /**
   * Vote on a comment via WebSocket.
   */
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

  /**
   * Send a comment via WebSocket.
   */
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

  /**
   * Send typing indicator for thread comments.
   */
  sendThreadTyping(threadId: string, isTyping: boolean) {
    const topic = `thread:${threadId}`;
    const channel = this.channels.get(topic);
    if (channel?.state === 'joined') {
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  /**
   * Vote on a poll option via WebSocket.
   */
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

  /**
   * Get list of viewers in a thread.
   */
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

  // Send typing indicator
  sendTyping(topic: string, isTyping: boolean) {
    const channel = this.channels.get(topic);
    if (channel) {
      // Send both key formats for backend compatibility
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  // Send reaction through socket for real-time updates
  sendReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    action: 'add' | 'remove'
  ): void {
    const topic = `conversation:${conversationId}`;
    const channel = this.channels.get(topic);

    if (channel?.state === 'joined') {
      // Backend expects separate events: add_reaction or remove_reaction
      const eventName = action === 'add' ? 'add_reaction' : 'remove_reaction';
      channel.push(eventName, {
        message_id: messageId,
        emoji,
      });
    }
  }

  // Get channel by topic
  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  // Get all online statuses for display purposes (without joining)
  getAllOnlineStatuses(): Map<string, Set<string>> {
    return new Map(this.onlineUsers);
  }

  // Peek at conversations to get presence data (lightweight join/leave)
  // Fixed: Now properly leaves channels after presence peek to prevent memory leak
  async peekConversationsPresence(conversationIds: string[]): Promise<void> {
    if (!this.socket?.isConnected()) {
      await this.connect();
    }

    const channelsToLeave: string[] = [];

    conversationIds.forEach((convId) => {
      const topic = `conversation:${convId}`;
      const existingChannel = this.channels.get(topic);

      // Only peek if not already joined (active conversation)
      if (!existingChannel || existingChannel.state !== 'joined') {
        this.joinConversation(convId);
        channelsToLeave.push(convId);
      }
    });

    // Leave channels after a brief delay to allow presence data to be received
    // This prevents memory leak from keeping channels open indefinitely
    if (channelsToLeave.length > 0) {
      setTimeout(() => {
        channelsToLeave.forEach((convId) => {
          // Only leave if not the active conversation
          const { activeConversationId } = useChatStore.getState();
          if (convId !== activeConversationId) {
            this.leaveConversation(convId);
          }
        });
      }, 2000); // 2 second delay to receive presence
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
export default socketManager;

// Hook to manage socket connection
export function useSocket() {
  return socketManager;
}
