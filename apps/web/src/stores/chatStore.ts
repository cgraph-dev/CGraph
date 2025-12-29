import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  encryptedContent: string | null;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'sticker' | 'gif' | 'system';
  replyToId: string | null;
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: Record<string, any>;
  reactions: Reaction[];
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
  };
  nickname: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  joinedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string[]>;
  hasMoreMessages: Record<string, boolean>;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (userIds: string[]) => Promise<Conversation>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  typingUsers: {},
  hasMoreMessages: {},

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const response = await api.get('/api/v1/conversations');
      set({ conversations: response.data.data, isLoadingConversations: false });
    } catch (error) {
      set({ isLoadingConversations: false });
      throw error;
    }
  },

  fetchMessages: async (conversationId: string, before?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params = before ? { before, limit: 50 } : { limit: 50 };
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`, {
        params,
      });
      const newMessages = response.data.data;
      const hasMore = newMessages.length === 50;

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: before
            ? [...newMessages, ...(state.messages[conversationId] || [])]
            : newMessages,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: hasMore,
        },
        isLoadingMessages: false,
      }));
    } catch (error) {
      set({ isLoadingMessages: false });
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string, replyToId?: string) => {
    try {
      const payload: any = { content };
      if (replyToId) payload.reply_to_id = replyToId;

      const response = await api.post(
        `/api/v1/conversations/${conversationId}/messages`,
        payload
      );
      get().addMessage(response.data.data);
    } catch (error) {
      throw error;
    }
  },

  editMessage: async (messageId: string, content: string) => {
    try {
      const response = await api.patch(`/api/v1/messages/${messageId}`, { content });
      get().updateMessage(response.data.data);
    } catch (error) {
      throw error;
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await api.delete(`/api/v1/messages/${messageId}`);
      const { activeConversationId } = get();
      if (activeConversationId) {
        get().removeMessage(messageId, activeConversationId);
      }
    } catch (error) {
      throw error;
    }
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      throw error;
    }
  },

  removeReaction: async (messageId: string, emoji: string) => {
    try {
      await api.delete(`/api/v1/messages/${messageId}/reactions/${emoji}`);
    } catch (error) {
      throw error;
    }
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  addMessage: (message: Message) => {
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || [];
      // Avoid duplicates
      if (conversationMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...conversationMessages, message],
        },
        conversations: state.conversations.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
            : conv
        ),
      };
    });
  },

  updateMessage: (message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (state.messages[message.conversationId] || []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    }));
  },

  removeMessage: (messageId: string, conversationId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    }));
  },

  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    });
  },

  markAsRead: async (conversationId: string) => {
    try {
      await api.post(`/api/v1/conversations/${conversationId}/read`);
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
      }));
    } catch (error) {
      // Ignore read receipt errors
    }
  },

  createConversation: async (userIds: string[]) => {
    const response = await api.post('/api/v1/conversations', {
      participant_ids: userIds,
    });
    const conversation = response.data.data;
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
    return conversation;
  },
}));
