import { Socket, Channel, Presence } from 'phoenix';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { socketLogger as logger } from './logger';

// Use configured WebSocket URL, falling back to API URL with ws scheme
const getWsUrl = (): string => {
  const wsUrl = Constants.expoConfig?.extra?.wsUrl;
  if (wsUrl) return wsUrl;
  
  // Fallback: derive from API URL
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';
  return apiUrl.replace(/^http/, 'ws') + '/socket';
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

type StatusChangeCallback = (conversationId: string, userId: string, isOnline: boolean) => void;
type MessageCallback = (event: string, payload: unknown) => void;

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private statusListeners: Set<StatusChangeCallback> = new Set();
  // Track which channels have their core handlers set up (prevents duplicate handlers)
  private channelHandlersSetUp: Set<string> = new Set();
  // Per-channel message listeners (components can subscribe/unsubscribe)
  private messageListeners: Map<string, Set<MessageCallback>> = new Map();
  // Track last join attempt timestamp per channel to prevent rapid rejoins
  private lastJoinAttempts: Map<string, number> = new Map();
  // Minimum time between join attempts (ms) - prevents join/leave loops
  private readonly JOIN_DEBOUNCE_MS = 1000;
  
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
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
        heartbeatIntervalMs: 30000,
      });
      
      this.socket.onOpen(() => {
        logger.log('Socket connected');
        resolve();
      });
      
      this.socket.onError((error) => {
        logger.error('Socket error:', error);
      });
      
      this.socket.onClose(() => {
        logger.log('Socket closed');
        // Note: Channels become invalid when socket closes
        // Clear channel references so they get recreated on reconnect
        this.channels.clear();
        this.channelHandlersSetUp.clear();
        this.presences.clear();
        this.onlineUsers.clear();
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
    this.socket?.disconnect();
    this.socket = null;
  }
  
  // Subscribe to user status changes
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
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
    this.statusListeners.forEach(callback => callback(conversationId, userId, isOnline));
  }
  
  // Check if user is online in a conversation
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
      }
      
      // Set up message event handlers that delegate to listeners
      ['new_message', 'message_updated', 'message_deleted'].forEach(event => {
        channel.on(event, (payload: unknown) => {
          logger.log(`[${topic}] Received ${event}:`, payload);
          this.messageListeners.get(topic)?.forEach(cb => cb(event, payload));
        });
      });
    }
    
    channel.join()
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
      
      // Clean up presence tracking for conversations
      if (topic.startsWith('conversation:')) {
        const conversationId = topic.replace('conversation:', '');
        this.onlineUsers.delete(conversationId);
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
