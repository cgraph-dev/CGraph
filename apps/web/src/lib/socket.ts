import { Socket, Channel } from 'phoenix';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message } from '@/stores/chatStore';
import { useGroupStore, ChannelMessage } from '@/stores/groupStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:4000/socket';

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private reconnectTimer: number | null = null;

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn('Cannot connect to socket: no auth token');
      return;
    }

    if (this.socket?.isConnected()) {
      return;
    }

    this.socket = new Socket(SOCKET_URL, {
      params: { token },
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        return Math.min(1000 * Math.pow(2, tries - 1), 30000);
      },
      heartbeatIntervalMs: 30000,
    });

    this.socket.onOpen(() => {
      console.log('Socket connected');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.onClose(() => {
      console.log('Socket disconnected');
    });

    this.socket.onError((error: unknown) => {
      console.error('Socket error:', error);
    });

    this.socket.connect();
  }

  disconnect() {
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket?.disconnect();
    this.socket = null;
  }

  // Join a conversation channel (DMs)
  joinConversation(conversationId: string): Channel {
    const topic = `conversation:${conversationId}`;

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const channel = this.socket.channel(topic, {});

    channel.on('new_message', (payload) => {
      const data = payload as { message: Message };
      useChatStore.getState().addMessage(data.message);
    });

    channel.on('message_updated', (payload) => {
      const data = payload as { message: Message };
      useChatStore.getState().updateMessage(data.message);
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
      console.log('Presence state:', state);
    });

    channel.on('presence_diff', (diff) => {
      console.log('Presence diff:', diff);
    });

    channel
      .join()
      .receive('ok', () => {
        console.log(`Joined conversation ${conversationId}`);
      })
      .receive('error', (resp: unknown) => {
        console.error(`Failed to join conversation ${conversationId}:`, resp);
      });

    this.channels.set(topic, channel);
    return channel;
  }

  leaveConversation(conversationId: string) {
    const topic = `conversation:${conversationId}`;
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  // Join a group channel
  joinGroupChannel(channelId: string): Channel {
    const topic = `channel:${channelId}`;

    if (this.channels.has(topic)) {
      return this.channels.get(topic)!;
    }

    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const channel = this.socket.channel(topic, {});

    channel.on('new_message', (payload) => {
      const data = payload as { message: ChannelMessage };
      useGroupStore.getState().addChannelMessage(data.message);
    });

    channel.on('message_updated', (payload) => {
      const data = payload as { message: ChannelMessage };
      useGroupStore.getState().updateChannelMessage(data.message);
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
      console.log('Channel presence state:', state);
    });

    channel.on('presence_diff', (diff) => {
      console.log('Channel presence diff:', diff);
    });

    channel
      .join()
      .receive('ok', () => {
        console.log(`Joined channel ${channelId}`);
      })
      .receive('error', (resp: unknown) => {
        console.error(`Failed to join channel ${channelId}:`, resp);
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
      channel.push('typing', { is_typing: isTyping });
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
}

// Export singleton instance
export const socketManager = new SocketManager();

// Hook to manage socket connection
export function useSocket() {
  return socketManager;
}
