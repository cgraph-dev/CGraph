import { Socket, Channel, Presence } from 'phoenix';
import { exponentialBackoffWithJitter } from '@cgraph/socket';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { socketLogger as logger } from './logger';

// Use configured WebSocket URL, falling back to API URL with ws scheme
const getWsUrl = (): string => {
  const wsUrl = Constants.expoConfig?.extra?.wsUrl;
  if (wsUrl) return wsUrl;

  // Fallback: derive from API URL
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (!apiUrl && !__DEV__) {
    throw new Error(
      'API URL must be configured for production builds (set extra.apiUrl in app.config.js)'
    );
  }
  return (apiUrl || 'http://localhost:4000').replace(/^http/, 'ws') + '/socket';
};

const WS_URL = getWsUrl();

// Types for presence tracking
interface PresenceMeta {
  online_at: string;
  typing: boolean;
  status: string;
  phx_ref?: string;
}

interface PresenceState {
  [userId: string]: { metas: PresenceMeta[] };
}

// Types for global friend presence
interface FriendPresenceData {
  online: boolean;
  status: string;
  lastSeen?: string;
  lastActive?: string;
  deviceCount?: number;
  hidden?: boolean;
}

// Types for typing indicators
interface TypingUser {
  userId: string;
  username?: string;
  startedAt: number;
}

type StatusChangeCallback = (conversationId: string, userId: string, isOnline: boolean) => void;
type GlobalStatusChangeCallback = (userId: string, isOnline: boolean, status?: string) => void;
type TypingChangeCallback = (conversationId: string, userId: string, isTyping: boolean) => void;
type MessageCallback = (event: string, payload: unknown) => void;

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map();
  // Track users currently typing per conversation
  private typingUsers: Map<string, Map<string, TypingUser>> = new Map();
  // Timeout refs for auto-clearing typing state
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private typingListeners: Set<TypingChangeCallback> = new Set();
  // Track which channels have their core handlers set up (prevents duplicate handlers)
  private channelHandlersSetUp: Set<string> = new Set();
  // Per-channel message listeners (components can subscribe/unsubscribe)
  private messageListeners: Map<string, Set<MessageCallback>> = new Map();
  // Track last join attempt timestamp per channel to prevent rapid rejoins
  private lastJoinAttempts: Map<string, number> = new Map();
  // Minimum time between join attempts (ms) - prevents join/leave loops
  private readonly JOIN_DEBOUNCE_MS = 1000;
  // Auto-clear typing after this duration (aligned with backend)
  private readonly TYPING_TIMEOUT_MS = 5000;

  // Global presence tracking for friends
  private presenceChannel: Channel | null = null;
  private globalOnlineFriends: Map<string, FriendPresenceData> = new Map();
  private globalStatusListeners: Set<GlobalStatusChangeCallback> = new Set();
  private presenceChannelSetUp = false;
  private presenceChannelJoined = false;
  // Track our own friend IDs for filtering incoming broadcasts
  private myFriendIds: Set<string> = new Set();

  // Session resumption — sequence tracking for zero-loss reconnects
  private sessionId: string | null = null;
  private lastSequence = 0;

  async connect(): Promise<void> {
    // Prevent concurrent connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.doConnect();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async doConnect(): Promise<void> {
    const token = await SecureStore.getItemAsync('cgraph_auth_token');

    if (!token) {
      logger.warn('No auth token available for socket connection');
      return;
    }

    // If already connected, nothing to do
    if (this.socket?.isConnected()) {
      return;
    }

    // If socket exists but not connected, wait for reconnection
    // Phoenix socket handles auto-reconnect internally
    if (this.socket) {
      logger.log('Socket exists, waiting for connection...');
      // Give it time to reconnect
      await new Promise<void>((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.isConnected()) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          resolve();
        }, 5000);
      });

      if (this.socket?.isConnected()) {
        logger.log('Socket reconnected');
        return;
      }

      // If still not connected, the socket is probably dead
      // Clear it so we create a new one
      logger.warn('Socket failed to reconnect, creating new socket');
      this.socket = null;
    }

    // No socket exists - create a new one
    logger.log('Creating new WebSocket connection:', WS_URL);

    return new Promise<void>((resolve) => {
      this.socket = new Socket(WS_URL, {
        params: { token },
        // Exponential backoff with equal jitter — prevents thundering herd at scale
        reconnectAfterMs: exponentialBackoffWithJitter(),
        heartbeatIntervalMs: 30000,
      });

      this.socket.onOpen(async () => {
        logger.log('Socket connected');
        // Auto-join global presence channel for friend status tracking
        this.joinPresenceChannel();

        // Join user channel for targeted updates (including friend presence)
        try {
          const storedUser = await SecureStore.getItemAsync('cgraph_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.id) {
              this.joinUserChannel(String(parsed.id));
            }
          }
        } catch (error) {
          logger.warn('Failed to load stored user for user channel join');
        }

        resolve();
      });

      this.socket.onError((error) => {
        logger.error('Socket error:', error);
      });

      this.socket.onClose(() => {
        logger.log('Socket closed');
        // Preserve session info for resumption on reconnect
        if (this.sessionId) {
          SecureStore.setItemAsync('ws_session_id', this.sessionId).catch(() => {});
          SecureStore.setItemAsync('ws_last_sequence', String(this.lastSequence)).catch(() => {});
        }
        // Note: Channels become invalid when socket closes
        // Clear channel references so they get recreated on reconnect
        this.channels.clear();
        this.channelHandlersSetUp.clear();
        this.presences.clear();
        this.onlineUsers.clear();
        // Clear global presence state
        this.presenceChannel = null;
        this.presenceChannelSetUp = false;
        this.presenceChannelJoined = false;
        this.globalOnlineFriends.clear();
      });

      this.socket.connect();

      // Resolve after timeout even if not connected
      setTimeout(resolve, 5000);
    });
  }

  disconnect(): void {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.presences.clear();
    this.onlineUsers.clear();
    this.channelHandlersSetUp.clear();
    this.messageListeners.clear();
    this.lastJoinAttempts.clear();
    // Clean up global presence
    this.presenceChannel?.leave();
    this.presenceChannel = null;
    this.presenceChannelSetUp = false;
    this.presenceChannelJoined = false;
    this.globalOnlineFriends.clear();
    this.myFriendIds.clear();
    // Reset session tracking
    this.sessionId = null;
    this.lastSequence = 0;
    SecureStore.deleteItemAsync('ws_session_id').catch(() => {});
    SecureStore.deleteItemAsync('ws_last_sequence').catch(() => {});
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Join the global presence:lobby channel for friend status tracking.
   * This is called automatically when socket connects.
   */
  private joinPresenceChannel(): void {
    // Guard: Don't create duplicate channels
    if (!this.socket || this.presenceChannel || this.presenceChannelSetUp) return;

    // Set flag immediately to prevent duplicate calls
    this.presenceChannelSetUp = true;

    logger.log('Joining global presence channel');
    this.presenceChannel = this.socket.channel('presence:lobby', {});

    // Set up event handlers only once per channel instance
    // Handle initial presence state (filtered by friends from backend)
    this.presenceChannel.on('presence_state', (rawPayload: unknown) => {
      const payload = rawPayload as { users: Record<string, FriendPresenceData> };
      logger.log(
        'Received friend presence state:',
        Object.keys(payload.users || {}).length,
        'friends'
      );
      this.globalOnlineFriends.clear();
      this.myFriendIds.clear();

      if (payload.users) {
        Object.entries(payload.users).forEach(([userId, data]) => {
          // Track all friend IDs we receive (these are our friends)
          this.myFriendIds.add(userId);
          if (!data.hidden) {
            this.globalOnlineFriends.set(userId, data);
            this.notifyGlobalStatusChange(userId, data.online, data.status);
          }
        });
      }
      logger.log('My friend IDs:', Array.from(this.myFriendIds));
    });

    // Handle friend coming online - filter to only our friends
    this.presenceChannel.on('friend_online', (rawPayload: unknown) => {
      const payload = rawPayload as { user_id: string; status: string; online_at: string };
      // Only process if this is one of our friends
      if (!this.myFriendIds.has(String(payload.user_id))) {
        return;
      }
      logger.log('Friend came online:', payload.user_id);
      const data: FriendPresenceData = {
        online: true,
        status: payload.status || 'online',
        lastActive: payload.online_at,
      };
      this.globalOnlineFriends.set(String(payload.user_id), data);
      this.notifyGlobalStatusChange(String(payload.user_id), true, payload.status);
    });

    // Handle friend going offline - filter to only our friends
    this.presenceChannel.on('friend_offline', (rawPayload: unknown) => {
      const payload = rawPayload as { user_id: string; last_seen: string };
      // Only process if this is one of our friends
      if (!this.myFriendIds.has(String(payload.user_id))) {
        return;
      }
      logger.log('Friend went offline:', payload.user_id);
      const existing = this.globalOnlineFriends.get(String(payload.user_id));
      this.globalOnlineFriends.set(String(payload.user_id), {
        ...existing,
        online: false,
        status: 'offline',
        lastSeen: payload.last_seen,
      });
      this.notifyGlobalStatusChange(String(payload.user_id), false, 'offline');
    });

    // Handle friend status change - filter to only our friends
    this.presenceChannel.on('friend_status_changed', (rawPayload: unknown) => {
      const payload = rawPayload as {
        user_id: string;
        status: string;
        status_message?: string;
        updated_at: string;
      };
      // Only process if this is one of our friends
      if (!this.myFriendIds.has(String(payload.user_id))) {
        return;
      }
      logger.log('Friend status changed:', payload.user_id, payload.status);
      const existing = this.globalOnlineFriends.get(String(payload.user_id));
      if (existing) {
        existing.status = payload.status;
        this.globalOnlineFriends.set(String(payload.user_id), existing);
      } else {
        this.globalOnlineFriends.set(String(payload.user_id), {
          online: true,
          status: payload.status,
        });
      }
      this.notifyGlobalStatusChange(String(payload.user_id), true, payload.status);
    });

    this.presenceChannel
      .join()
      .receive('ok', (response: unknown) => {
        // Only log once to prevent spam from duplicate callbacks
        if (!this.presenceChannelJoined) {
          this.presenceChannelJoined = true;
          logger.log('Joined global presence channel:', response);
        }
      })
      .receive('error', (response: unknown) => {
        logger.error('Failed to join presence channel:', response);
        this.presenceChannel = null;
        this.presenceChannelSetUp = false;
        this.presenceChannelJoined = false;
      });
  }

  /**
   * Refresh friend list and presence data.
   * Call this after adding/removing friends.
   */
  refreshFriendPresence(): void {
    if (this.presenceChannel) {
      // Clear friend IDs so they get rebuilt from the new presence_state
      this.myFriendIds.clear();
      this.presenceChannel.push('refresh_friends', {});
    }
  }

  /**
   * Add a friend ID to track (useful when accepting friend request)
   */
  addFriendToTrack(friendId: string): void {
    this.myFriendIds.add(String(friendId));
  }

  /**
   * Subscribe to global friend status changes.
   * Unlike onStatusChange which is per-conversation, this tracks global friend presence.
   */
  onGlobalStatusChange(callback: GlobalStatusChangeCallback): () => void {
    this.globalStatusListeners.add(callback);
    return () => this.globalStatusListeners.delete(callback);
  }

  /**
   * Notify global status change listeners.
   */
  private notifyGlobalStatusChange(userId: string, isOnline: boolean, status?: string): void {
    this.globalStatusListeners.forEach((callback) => callback(userId, isOnline, status));
  }

  /**
   * Check if a friend is online globally.
   * Returns false if user is not a friend (presence is hidden).
   */
  isFriendOnline(userId: string): boolean {
    const presence = this.globalOnlineFriends.get(userId);
    return presence?.online === true && !presence?.hidden;
  }

  /**
   * Get friend's presence data.
   * Returns null if user is not a friend.
   */
  getFriendPresence(userId: string): FriendPresenceData | null {
    const presence = this.globalOnlineFriends.get(userId);
    if (presence?.hidden) return null;
    return presence || null;
  }

  /**
   * Get all online friends.
   */
  getOnlineFriends(): string[] {
    const onlineFriends: string[] = [];
    this.globalOnlineFriends.forEach((data, id) => {
      if (data.online && !data.hidden) {
        onlineFriends.push(id);
      }
    });
    return onlineFriends;
  }

  /**
   * Query bulk presence status for a list of user IDs.
   * Only returns presence for friends; non-friends will show as hidden/offline.
   */
  async getBulkFriendStatus(userIds: string[]): Promise<Record<string, FriendPresenceData>> {
    return new Promise((resolve) => {
      if (!this.presenceChannel) {
        // Return offline for all if not connected
        const result: Record<string, FriendPresenceData> = {};
        userIds.forEach((id) => {
          result[id] = { online: false, status: 'unknown', hidden: true };
        });
        resolve(result);
        return;
      }

      this.presenceChannel
        .push('get_bulk_status', { user_ids: userIds })
        .receive('ok', (rawResponse: unknown) => {
          const response = rawResponse as { users: Record<string, FriendPresenceData> };
          // Update local cache
          if (response.users) {
            Object.entries(response.users).forEach(([userId, data]) => {
              this.globalOnlineFriends.set(userId, data);
            });
          }
          resolve(response.users || {});
        })
        .receive('error', () => {
          const result: Record<string, FriendPresenceData> = {};
          userIds.forEach((id) => {
            result[id] = { online: false, status: 'unknown', hidden: true };
          });
          resolve(result);
        })
        .receive('timeout', () => {
          const result: Record<string, FriendPresenceData> = {};
          userIds.forEach((id) => {
            result[id] = { online: false, status: 'unknown', hidden: true };
          });
          resolve(result);
        });
    });
  }

  /**
   * Set current user's online status.
   */
  setStatus(status: string, statusMessage?: string): void {
    if (this.presenceChannel) {
      this.presenceChannel.push('set_status', {
        status,
        status_message: statusMessage,
      });
    }
  }

  /**
   * Set app state (foreground/background).
   */
  setAppState(state: 'foreground' | 'background'): void {
    if (this.presenceChannel) {
      this.presenceChannel.push('set_app_state', { state });
    }
  }

  // User channel for private notifications
  private userChannel: Channel | null = null;
  private userChannelSetUp = false;
  private e2eeKeyRevokedCallback: ((userId: string, keyId: string) => void) | null = null;

  /**
   * Set callback for E2EE key revocation events.
   * This should be called from E2EEProvider to handle key revocations.
   */
  setE2EEKeyRevokedHandler(callback: (userId: string, keyId: string) => void): void {
    this.e2eeKeyRevokedCallback = callback;
  }

  /**
   * Join the user's personal channel for receiving targeted notifications.
   *
   * This channel receives:
   * - E2EE key revocation events (critical for Forward Secrecy)
   * - Friend request notifications
   * - Message previews for push notifications
   * - Account state changes
   *
   * @param userId - Current user's ID
   * @returns Channel instance or null if unable to join
   */
  async joinUserChannel(userId: string): Promise<Channel | null> {
    const topic = `user:${userId}`;

    if (this.userChannel) {
      return this.userChannel;
    }

    if (!this.socket) {
      logger.warn('Cannot join user channel: socket not connected');
      return null;
    }

    logger.log('Joining user channel:', topic);

    // Build join params with session resumption data
    const joinParams: Record<string, unknown> = { include_contact_presence: true };
    try {
      const savedSessionId = await SecureStore.getItemAsync('ws_session_id');
      const savedSequence = await SecureStore.getItemAsync('ws_last_sequence');
      if (savedSessionId && savedSequence) {
        joinParams.resume_session_id = savedSessionId;
        joinParams.last_sequence = parseInt(savedSequence, 10);
        logger.log('Resuming session:', savedSessionId, 'from seq:', savedSequence);
      }
    } catch {
      // SecureStore unavailable — proceed without resumption
    }

    this.userChannel = this.socket.channel(topic, joinParams);

    if (!this.userChannelSetUp) {
      this.userChannelSetUp = true;

      // Handle E2EE key revocation events - CRITICAL for Forward Secrecy
      this.userChannel.on('e2ee:key_revoked', (rawPayload: unknown) => {
        const payload = rawPayload as { user_id: string; key_id: string; revoked_at: string };
        logger.log('E2EE key revoked event received:', payload);
        if (this.e2eeKeyRevokedCallback) {
          this.e2eeKeyRevokedCallback(payload.user_id, payload.key_id);
        }
      });

      // Handle friend request notifications
      this.userChannel.on('friend_request', (rawPayload: unknown) => {
        logger.log('Friend request received:', rawPayload);
        // Could dispatch to a notification handler here
      });

      // Handle message previews (for notifications when app is in background)
      this.userChannel.on('message_preview', (rawPayload: unknown) => {
        logger.log('Message preview:', rawPayload);
      });

      // Initial contact presence snapshot
      this.userChannel.on('contact_presence', (rawPayload: unknown) => {
        const payload = rawPayload as { contacts?: Record<string, FriendPresenceData> };
        const contacts = payload.contacts || {};

        this.globalOnlineFriends.clear();
        Object.entries(contacts).forEach(([userId, status]) => {
          if (status?.online) {
            this.globalOnlineFriends.set(userId, status);
          }
        });

        logger.log('Contact presence snapshot:', this.globalOnlineFriends.size);
      });

      // Contact presence updates (friend online/offline)
      this.userChannel.on('contact_status_changed', (rawPayload: unknown) => {
        const payload = rawPayload as { user_id: string; online: boolean; status?: string };
        if (!payload?.user_id) return;

        if (payload.online) {
          this.globalOnlineFriends.set(payload.user_id, {
            online: true,
            status: payload.status || 'online',
          });
        } else {
          this.globalOnlineFriends.delete(payload.user_id);
        }

        this.notifyGlobalStatusChange(payload.user_id, payload.online, payload.status);
      });
    }

    // Track sequence numbers from incoming events for session resumption
    this.userChannel.on('resume_complete', (payload: unknown) => {
      const data = payload as Record<string, unknown>;
      if (typeof data.new_session_id === 'string') {
        this.sessionId = data.new_session_id;
      }
      logger.log('Session resumed, new session:', this.sessionId);
    });

    this.userChannel
      .join()
      .receive('ok', (response: unknown) => {
        const data = response as Record<string, unknown>;
        // Capture session ID from join response
        if (typeof data._session_id === 'string') {
          this.sessionId = data._session_id;
        }
        logger.log('Joined user channel:', response);
      })
      .receive('error', (response: unknown) => {
        logger.error('Failed to join user channel:', response);
        this.userChannel = null;
        this.userChannelSetUp = false;
      });

    return this.userChannel;
  }

  leaveUserChannel(): void {
    if (this.userChannel) {
      this.userChannel.leave();
      this.userChannel = null;
      this.userChannelSetUp = false;
    }
  }

  // Subscribe to user status changes
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // Subscribe to typing indicator changes
  onTypingChange(callback: TypingChangeCallback): () => void {
    this.typingListeners.add(callback);
    return () => this.typingListeners.delete(callback);
  }

  // Notify typing change listeners
  private notifyTypingChange(conversationId: string, userId: string, isTyping: boolean): void {
    this.typingListeners.forEach((callback) => callback(conversationId, userId, isTyping));
  }

  // Update typing user state for a conversation
  private updateTypingState(
    conversationId: string,
    userId: string,
    isTyping: boolean,
    username?: string
  ): void {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Map());
    }

    const conversationTyping = this.typingUsers.get(conversationId)!;
    const timeoutKey = `${conversationId}:${userId}`;

    // Clear any existing timeout for this user
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    if (isTyping) {
      conversationTyping.set(userId, {
        userId,
        username,
        startedAt: Date.now(),
      });

      // Auto-clear after timeout (failsafe if stop event missed)
      const timeout = setTimeout(() => {
        this.updateTypingState(conversationId, userId, false);
      }, this.TYPING_TIMEOUT_MS);
      this.typingTimeouts.set(timeoutKey, timeout as unknown as NodeJS.Timeout);
    } else {
      conversationTyping.delete(userId);
    }

    this.notifyTypingChange(conversationId, userId, isTyping);
  }

  // Get list of users currently typing in a conversation
  getTypingUsers(conversationId: string): TypingUser[] {
    const conversationTyping = this.typingUsers.get(conversationId);
    if (!conversationTyping) return [];
    return Array.from(conversationTyping.values());
  }

  // Send typing indicator to backend
  sendTyping(topic: string, isTyping: boolean): void {
    const channel = this.channels.get(topic);
    if (channel) {
      // Send both key formats for backend compatibility
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  // Subscribe to messages on a channel
  onChannelMessage(topic: string, callback: MessageCallback): () => void {
    if (!this.messageListeners.has(topic)) {
      this.messageListeners.set(topic, new Set());
    }
    this.messageListeners.get(topic)!.add(callback);
    return () => {
      this.messageListeners.get(topic)?.delete(callback);
    };
  }

  // Notify status change listeners
  private notifyStatusChange(conversationId: string, userId: string, isOnline: boolean): void {
    this.statusListeners.forEach((callback) => callback(conversationId, userId, isOnline));
  }

  // Check if user is online in a conversation
  // First checks global friend presence, then falls back to conversation presence
  // Uses string coercion to ensure consistent comparison regardless of ID format
  isUserOnline(conversationId: string, userId: string): boolean {
    // First, check global friend presence (preferred)
    if (this.isFriendOnline(userId)) {
      return true;
    }

    // Fallback to conversation-specific presence
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

  // Get online users for a conversation
  getOnlineUsers(conversationId: string): string[] {
    return Array.from(this.onlineUsers.get(conversationId) || []);
  }

  /**
   * Join a Phoenix channel with comprehensive lifecycle management.
   *
   * Architectural improvements:
   * - Debounces rapid join attempts to prevent join/leave loops
   * - Validates socket connection state before attempting join
   * - Reuses existing healthy channels to minimize reconnection overhead
   * - Cleans up stale channels in bad states (closed/errored)
   * - Sets up presence tracking once per channel to prevent duplicate handlers
   * - Implements idempotent handler registration
   *
   * @param topic - Channel topic (e.g., "conversation:123")
   * @param params - Optional parameters for channel join
   * @returns Channel instance or null if unable to join
   */
  joinChannel(topic: string, params: Record<string, unknown> = {}): Channel | null {
    if (!this.socket) {
      logger.error('Socket not connected, cannot join channel:', topic);
      return null;
    }

    // Check if socket is actually connected
    if (!this.socket.isConnected()) {
      logger.warn('Socket exists but not connected, waiting for connection:', topic);
      return null;
    }

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
        // Already joined or joining, return existing channel without updating timestamp
        logger.log(`Reusing existing channel ${topic} in state: ${state}`);
        return existingChannel;
      }
      // Channel exists but is in a bad state (closed, errored, leaving)
      // Remove it and create a new one
      logger.warn(`Channel ${topic} in bad state: ${state}, recreating`);
      this.channels.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.presences.delete(topic);
      if (topic.startsWith('conversation:')) {
        const conversationId = topic.replace('conversation:', '');
        this.onlineUsers.delete(conversationId);
      }
    }

    // Update join attempt timestamp BEFORE creating channel
    this.lastJoinAttempts.set(topic, now);

    logger.log('Creating new channel:', topic);
    const channel = this.socket.channel(topic, params);
    this.channels.set(topic, channel);

    // Set up handlers only once per channel
    if (!this.channelHandlersSetUp.has(topic)) {
      this.channelHandlersSetUp.add(topic);

      // Set up presence tracking for conversation channels
      if (topic.startsWith('conversation:')) {
        const conversationId = topic.replace('conversation:', '');
        const presence = new Presence(channel);
        this.presences.set(topic, presence);
        this.onlineUsers.set(conversationId, new Set());

        presence.onSync(() => {
          const onlineSet = new Set<string>();
          presence.list((id: string) => {
            onlineSet.add(id);
            return id;
          });

          // Notify changes
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
          // Only log if there's a meaningful change to reduce noise
          if (
            __DEV__ &&
            (previousSet.size !== onlineSet.size ||
              Array.from(previousSet).some((u) => !onlineSet.has(u)))
          ) {
            logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
          }
        });

        // Note: onJoin/onLeave are called for every presence update (including typing changes)
        // We rely on onSync for the authoritative state to avoid notification spam
        presence.onJoin((id: string) => {
          // Only log in dev mode and avoid excessive logging
          if (__DEV__) {
            // Don't log - onSync handles state already
          }
          this.onlineUsers.get(conversationId)?.add(id);
        });

        presence.onLeave((id: string, _current: unknown, leftPresences: unknown) => {
          // Only notify offline if ALL presences for this user have left
          const stillOnline = presence.list((uid: string) => uid === id).length > 0;
          if (!stillOnline) {
            if (__DEV__) {
              logger.log(`User ${id} fully left ${conversationId}`);
            }
            this.onlineUsers.get(conversationId)?.delete(id);
            this.notifyStatusChange(conversationId, id, false);
          }
        });
      }

      // Set up message event handlers that delegate to listeners
      [
        'new_message',
        'message_updated',
        'message_deleted',
        'message_pinned',
        'message_unpinned',
        'reaction_added',
        'reaction_removed',
        'typing',
      ].forEach((event) => {
        channel.on(event, (payload: unknown) => {
          // Track sequence number for session resumption
          const data = payload as Record<string, unknown>;
          if (typeof data._seq === 'number') {
            this.lastSequence = data._seq;
          }
          logger.log(`[${topic}] Received ${event}:`, payload);
          this.messageListeners.get(topic)?.forEach((cb) => cb(event, payload));
        });
      });

      // Internal typing state tracking for all channel types
      {
        const entityId = topic.includes(':') ? topic.split(':').slice(1).join(':') : topic;

        channel.on('typing', (payload: unknown) => {
          const typedPayload = payload as {
            user_id: string;
            username?: string;
            is_typing?: boolean;
            typing?: boolean;
          };
          const isTyping = typedPayload.is_typing ?? typedPayload.typing ?? false;
          const userId = typedPayload.user_id;

          logger.log(`[${topic}] Typing indicator:`, { userId, isTyping });
          this.updateTypingState(entityId, userId, isTyping, typedPayload.username);
        });
      }
    }

    channel
      .join()
      .receive('ok', (response: unknown) => {
        logger.log(`Channel joined ${topic}:`, response);
      })
      .receive('error', (response: unknown) => {
        logger.error(`Failed to join ${topic}:`, response);
        // Clean up on failure
        this.channels.delete(topic);
        this.channelHandlersSetUp.delete(topic);
        this.lastJoinAttempts.delete(topic); // Allow retry after error
      });

    return channel;
  }

  /**
   * Leave a channel and clean up all associated state.
   *
   * Properly cleans up:
   * - Channel connection
   * - Presence tracking
   * - Handler registration state
   * - Message listeners
   * - Online user tracking
   * - Typing state and timeouts
   * - Join attempt tracking
   *
   * @param topic - Channel topic to leave
   */
  leaveChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      logger.log(`Leaving channel: ${topic}`);
      channel.leave();
      this.channels.delete(topic);
      this.presences.delete(topic);
      this.channelHandlersSetUp.delete(topic);
      this.messageListeners.delete(topic);
      this.lastJoinAttempts.delete(topic);

      // Clean up presence and typing tracking for conversations
      if (topic.startsWith('conversation:')) {
        const conversationId = topic.replace('conversation:', '');
        this.onlineUsers.delete(conversationId);

        // Clear typing state and timeouts for this conversation
        const conversationTyping = this.typingUsers.get(conversationId);
        if (conversationTyping) {
          conversationTyping.forEach((_, userId) => {
            const timeoutKey = `${conversationId}:${userId}`;
            const timeout = this.typingTimeouts.get(timeoutKey);
            if (timeout) {
              clearTimeout(timeout);
              this.typingTimeouts.delete(timeoutKey);
            }
          });
          this.typingUsers.delete(conversationId);
        }
      }
    }
  }

  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }
}

// Persist socket manager across Fast Refresh by storing on global object
// This prevents the channels Map from being cleared on module re-evaluation
declare global {
  var __socketManager: SocketManager | undefined;
}

if (!global.__socketManager) {
  global.__socketManager = new SocketManager();
}

export const socketManager = global.__socketManager;
export default socketManager;
