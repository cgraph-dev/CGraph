import { Socket, Channel, Presence } from 'phoenix';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message } from '@/stores/chatStore';
import { useGroupStore, ChannelMessage } from '@/stores/groupStore';
import { socketLogger as logger } from './logger';
import { normalizeMessage } from './apiUtils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000/socket';

// Types for presence tracking
interface PresenceMeta {
  online_at: string;
  typing: boolean;
  status: string;
  phx_ref?: string;
}

// Used for presence tracking state
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PresenceState {
  [userId: string]: { metas: PresenceMeta[] };
}

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set<userId>
  private reconnectTimer: number | null = null;
  private statusListeners: Set<(conversationId: string, userId: string, isOnline: boolean) => void> = new Set();
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
    if (!token) {
      logger.warn('Cannot connect to socket: no auth token');
      return Promise.resolve();
    }

    if (this.socket?.isConnected()) {
      return Promise.resolve();
    }

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
        logger.error('Socket error:', error);
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
    this.socket?.disconnect();
    this.socket = null;
  }

  // Subscribe to user status changes
  onStatusChange(callback: (conversationId: string, userId: string, isOnline: boolean) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // Notify status change listeners
  private notifyStatusChange(conversationId: string, userId: string, isOnline: boolean) {
    this.statusListeners.forEach(callback => callback(conversationId, userId, isOnline));
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
        onlineSet.forEach(userId => {
          if (!previousSet.has(userId)) {
            this.notifyStatusChange(conversationId, userId, true);
          }
        });
        previousSet.forEach(userId => {
          if (!onlineSet.has(userId)) {
            this.notifyStatusChange(conversationId, userId, false);
          }
        });
        
        this.onlineUsers.set(conversationId, onlineSet);
        logger.log(`Presence sync for ${conversationId}:`, Array.from(onlineSet));
      });
      
      // Handle join/leave events
      presence.onJoin((id: string) => {
        logger.log(`User ${id} joined ${conversationId}`);
        this.onlineUsers.get(conversationId)?.add(id);
        this.notifyStatusChange(conversationId, id, true);
      });
      
      presence.onLeave((id: string) => {
        logger.log(`User ${id} left ${conversationId}`);
        this.onlineUsers.get(conversationId)?.delete(id);
        this.notifyStatusChange(conversationId, id, false);
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
        const data = payload as { user_id: string; is_typing: boolean };
        useChatStore.getState().setTypingUser(conversationId, data.user_id, data.is_typing);
      });

      channel.on('presence_state', (state) => {
        logger.log('Presence state:', state);
      });

      channel.on('presence_diff', (diff) => {
        logger.log('Presence diff:', diff);
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

  // Send typing indicator
  sendTyping(topic: string, isTyping: boolean) {
    const channel = this.channels.get(topic);
    if (channel) {
      // Send both key formats for backend compatibility
      channel.push('typing', { typing: isTyping, is_typing: isTyping });
    }
  }

  // Get channel by topic
  getChannel(topic: string): Channel | undefined {
    return this.channels.get(topic);
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }

  // Get all online statuses for display purposes (without joining)
  getAllOnlineStatuses(): Map<string, Set<string>> {
    return new Map(this.onlineUsers);
  }

  // Peek at conversations to get presence data (lightweight join/leave)
  async peekConversationsPresence(conversationIds: string[]): Promise<void> {
    if (!this.socket?.isConnected()) {
      await this.connect();
    }

    conversationIds.forEach(convId => {
      const topic = `conversation:${convId}`;
      const existingChannel = this.channels.get(topic);
      
      // Only peek if not already joined
      if (!existingChannel || existingChannel.state !== 'joined') {
        this.joinConversation(convId);
      }
    });
  }
}

// Export singleton instance
export const socketManager = new SocketManager();

// Hook to manage socket connection
export function useSocket() {
  return socketManager;
}
