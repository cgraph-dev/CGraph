import { Socket, Channel } from 'phoenix';
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

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private connectionPromise: Promise<void> | null = null;
  
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
    
    this.socket.onError((error: unknown) => {
      logger.error('Socket error:', error);
    });
    
    this.socket.onClose((event: unknown) => {
      logger.log('Socket closed:', event);
    });
    
    this.socket.connect();
  }
  
  disconnect(): void {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket?.disconnect();
    this.socket = null;
  }
  
  joinChannel(topic: string, params: Record<string, unknown> = {}): Channel | null {
    if (!this.socket) {
      logger.error('Socket not connected');
      return null;
    }
    
    const existingChannel = this.channels.get(topic);
    if (existingChannel) {
      return existingChannel;
    }
    
    const channel = this.socket.channel(topic, params);
    
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
