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

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private statusListeners: Set<StatusChangeCallback> = new Set();
  
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
    
    if (this.socket?.isConnected()) {
      return;
    }
    
    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }
    
    logger.log('Connecting to WebSocket:', WS_URL);
    
    this.socket = new Socket(WS_URL, {
      params: { token },
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
      heartbeatIntervalMs: 30000,
    });
    
    this.socket.onOpen(() => {
      logger.log('Socket connected');
    });
    
    this.socket.onError((error) => {
      logger.error('Socket error:', error);
    });
    
    this.socket.onClose(() => {
      logger.log('Socket closed');
    });
    
    this.socket.connect();
  }
  
  disconnect(): void {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.presences.clear();
    this.onlineUsers.clear();
    this.socket?.disconnect();
    this.socket = null;
  }
  
  // Subscribe to user status changes
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }
  
  // Notify status change listeners
  private notifyStatusChange(conversationId: string, userId: string, isOnline: boolean): void {
    this.statusListeners.forEach(callback => callback(conversationId, userId, isOnline));
  }
  
  // Check if user is online in a conversation
  isUserOnline(conversationId: string, userId: string): boolean {
    return this.onlineUsers.get(conversationId)?.has(userId) || false;
  }
  
  // Get online users for a conversation
  getOnlineUsers(conversationId: string): string[] {
    return Array.from(this.onlineUsers.get(conversationId) || []);
  }
  
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
    
    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      logger.log('Already joined channel:', topic);
      return existingChannel;
    }
    
    const channel = this.socket.channel(topic, params);
    
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
    
    channel.join()
      .receive('ok', (response: unknown) => {
        logger.log(`Joined ${topic}:`, response);
      })
      .receive('error', (response: unknown) => {
        logger.error(`Failed to join ${topic}:`, response);
      });
    
    this.channels.set(topic, channel);
    return channel;
  }
  
  leaveChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
      this.presences.delete(topic);
      
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

export const socketManager = new SocketManager();
export default socketManager;
