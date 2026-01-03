import { Socket, Channel } from 'phoenix';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { socketLogger as logger } from './logger';

const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'ws://localhost:4000/socket';

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  
  async connect(): Promise<void> {
    const token = await SecureStore.getItemAsync('cgraph_auth_token');
    
    if (!token) {
      logger.warn('No auth token available for socket connection');
      return;
    }
    
    if (this.socket?.isConnected()) {
      return;
    }
    
    this.socket = new Socket(WS_URL, {
      params: { token },
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
    });
    
    this.socket.onOpen(() => {
      logger.log('Socket connected');
    });
    
    this.socket.onError((error: unknown) => {
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
