/**
 * Mobile Chat Store
 *
 * Real Zustand store replacing the useChatFacade stub.
 * Handles conversations, messages, typing indicators, reactions,
 * and integrates with the Phoenix WebSocket via socketManager.
 *
 * Mirrors web's chat store architecture adapted for React Native.
 *
 * @module stores/chatStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import api from '../lib/api';
import socketManager from '../lib/socket';

// ── Types ──────────────────────────────────────────────────────────────

export interface MessageSender {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; username: string };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio' | 'voice' | 'system';
  replyToId: string | null;
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  isEncrypted: boolean;
  encryptedContent: string | null;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  reactions: Reaction[];
  sender: MessageSender;
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
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const MAX_MESSAGES = 500;

function normalizeMessage(raw: Record<string, unknown>): Message {
  const sender = (raw.sender || {}) as Record<string, unknown>;
  return {
    id: raw.id as string,
    conversationId: (raw.conversation_id || raw.conversationId) as string,
    senderId: (raw.sender_id || raw.senderId || sender.id) as string,
    content: (raw.content || '') as string,
    messageType: (raw.message_type || raw.messageType || 'text') as Message['messageType'],
    replyToId: (raw.reply_to_id || raw.replyToId || null) as string | null,
    replyTo: raw.reply_to ? normalizeMessage(raw.reply_to as Record<string, unknown>) : null,
    isPinned: (raw.is_pinned ?? raw.isPinned ?? false) as boolean,
    isEdited: (raw.is_edited ?? raw.isEdited ?? false) as boolean,
    isEncrypted: (raw.is_encrypted ?? raw.isEncrypted ?? false) as boolean,
    encryptedContent: (raw.encrypted_content || raw.encryptedContent || null) as string | null,
    deletedAt: (raw.deleted_at || raw.deletedAt || null) as string | null,
    metadata: (raw.metadata || {}) as Record<string, unknown>,
    reactions: normalizeReactions(raw.reactions),
    sender: {
      id: (sender.id || '') as string,
      username: (sender.username || '') as string,
      displayName: (sender.display_name || sender.displayName || null) as string | null,
      avatarUrl: (sender.avatar_url || sender.avatarUrl || null) as string | null,
    },
    createdAt: (raw.created_at || raw.createdAt || raw.inserted_at || '') as string,
    updatedAt: (raw.updated_at || raw.updatedAt || '') as string,
  };
}

function normalizeReactions(raw: unknown): Reaction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: Record<string, unknown>) => ({
    id: (r.id || `${r.emoji}-${r.user_id || (r.user as Record<string, unknown>)?.id}`) as string,
    emoji: r.emoji as string,
    userId: (r.user_id || r.userId || (r.user as Record<string, unknown>)?.id || '') as string,
    user: {
      id: ((r.user as Record<string, unknown>)?.id || r.user_id || '') as string,
      username: ((r.user as Record<string, unknown>)?.username || '') as string,
    },
  }));
}

function normalizeConversation(raw: Record<string, unknown>): Conversation {
  const participants = Array.isArray(raw.participants)
    ? raw.participants.map((p: Record<string, unknown>) => {
        const user = (p.user || {}) as Record<string, unknown>;
        return {
          id: (p.id || '') as string,
          userId: (p.user_id || p.userId || user.id || '') as string,
          user: {
            id: (user.id || '') as string,
            username: (user.username || '') as string,
            displayName: (user.display_name || user.displayName || null) as string | null,
            avatarUrl: (user.avatar_url || user.avatarUrl || null) as string | null,
            status: (user.status || 'offline') as string,
          },
          nickname: (p.nickname || null) as string | null,
          joinedAt: (p.joined_at || p.joinedAt || '') as string,
        };
      })
    : [];

  const lastMsg = raw.last_message || raw.lastMessage;
  return {
    id: raw.id as string,
    type: (raw.type || 'direct') as 'direct' | 'group',
    name: (raw.name || null) as string | null,
    avatarUrl: (raw.avatar_url || raw.avatarUrl || null) as string | null,
    participants,
    lastMessage: lastMsg ? normalizeMessage(lastMsg as Record<string, unknown>) : null,
    unreadCount: (raw.unread_count ?? raw.unreadCount ?? 0) as number,
    isPinned: (raw.is_pinned ?? raw.isPinned ?? false) as boolean,
    isMuted: (raw.is_muted ?? raw.isMuted ?? false) as boolean,
    createdAt: (raw.created_at || raw.createdAt || '') as string,
    updatedAt: (raw.updated_at || raw.updatedAt || '') as string,
  };
}

// ── Store Interface ────────────────────────────────────────────────────

interface ChatState {
  // State
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  messageIds: Record<string, Set<string>>;
  typingUsers: Record<string, string[]>;
  hasMoreMessages: Record<string, boolean>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyToId?: string) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (userIds: string[]) => Promise<Conversation>;

  // Socket-driven mutations
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    username?: string
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (updates: Partial<Conversation> & { id: string }) => void;

  // Helpers
  getRecipientId: (conversationId: string, currentUserId: string) => string | null;
  sendTypingIndicator: (conversationId: string, isTyping: boolean) => void;

  // Lifecycle
  subscribeToConversation: (conversationId: string) => () => void;
}

// ── Store ──────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────
  conversations: [],
  activeConversationId: null,
  messages: {},
  messageIds: {},
  typingUsers: {},
  hasMoreMessages: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  lastFetchedAt: null,

  // ── Actions ────────────────────────────────────────────────────────

  fetchConversations: async () => {
    const { lastFetchedAt, isLoadingConversations } = get();
    const now = Date.now();
    if (isLoadingConversations) return;
    if (lastFetchedAt && now - lastFetchedAt < 30_000) return;

    set({ isLoadingConversations: true });
    try {
      const response = await api.get('/api/v1/conversations');
      const raw = response.data?.conversations || response.data?.data || response.data || [];
      const conversations = (Array.isArray(raw) ? raw : []).map((c: Record<string, unknown>) =>
        normalizeConversation(c)
      );
      set({ conversations, isLoadingConversations: false, lastFetchedAt: now });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId: string, before?: string) => {
    set({ isLoadingMessages: true });
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (before) params.before = before;

      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`, {
        params,
      });
      const raw = response.data?.messages || response.data?.data || response.data || [];
      const newMessages = (Array.isArray(raw) ? raw : []).map((m: Record<string, unknown>) =>
        normalizeMessage(m)
      );
      const hasMore = newMessages.length === 50;

      set((state) => {
        const existingIds = state.messageIds[conversationId] || new Set<string>();
        const newIdSet = new Set(existingIds);
        newMessages.forEach((m) => newIdSet.add(m.id));

        let merged = before
          ? [...newMessages, ...(state.messages[conversationId] || [])]
          : newMessages;

        // Enforce memory cap
        if (merged.length > MAX_MESSAGES) {
          const pruneCount = merged.length - MAX_MESSAGES;
          const pruned = before
            ? merged.slice(merged.length - pruneCount)
            : merged.slice(0, pruneCount);
          merged = before ? merged.slice(0, MAX_MESSAGES) : merged.slice(pruneCount);
          for (const p of pruned) newIdSet.delete(p.id);
        }

        return {
          messages: { ...state.messages, [conversationId]: merged },
          messageIds: { ...state.messageIds, [conversationId]: newIdSet },
          hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: hasMore },
          isLoadingMessages: false,
        };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId: string, content: string, replyToId?: string) => {
    const payload: Record<string, unknown> = { content };
    if (replyToId) payload.reply_to_id = replyToId;

    const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
    const rawMessage = response.data?.message || response.data?.data || response.data;
    if (rawMessage) {
      const message = normalizeMessage(rawMessage as Record<string, unknown>);
      get().addMessage(message);
    }
  },

  editMessage: async (conversationId: string, messageId: string, content: string) => {
    const response = await api.patch(
      `/api/v1/conversations/${conversationId}/messages/${messageId}`,
      { content }
    );
    const rawMessage = response.data?.message || response.data?.data || response.data;
    if (rawMessage) {
      const message = normalizeMessage(rawMessage as Record<string, unknown>);
      get().updateMessage(message);
    }
  },

  deleteMessage: async (conversationId: string, messageId: string) => {
    await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
    get().removeMessage(messageId, conversationId);
  },

  addReaction: async (messageId: string, emoji: string) => {
    await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
  },

  removeReaction: async (messageId: string, emoji: string) => {
    await api.delete(`/api/v1/messages/${messageId}/reactions/${emoji}`);
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  markAsRead: async (conversationId: string) => {
    try {
      await api.post(`/api/v1/conversations/${conversationId}/read`);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch {
      // Ignore read receipt errors
    }
  },

  createConversation: async (userIds: string[]) => {
    const response = await api.post('/api/v1/conversations', {
      participant_ids: userIds,
    });
    const raw = response.data?.conversation || response.data?.data || response.data;
    const conversation = normalizeConversation(raw as Record<string, unknown>);
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
    return conversation;
  },

  // ── Socket-driven mutations ────────────────────────────────────────

  addMessage: (message: Message) => {
    set((state) => {
      const existing = state.messages[message.conversationId] || [];
      const idSet = state.messageIds[message.conversationId] || new Set<string>();
      if (idSet.has(message.id)) return state;

      const newIdSet = new Set(idSet);
      newIdSet.add(message.id);
      let updated = [...existing, message];

      if (updated.length > MAX_MESSAGES) {
        const pruneCount = updated.length - MAX_MESSAGES;
        const pruned = updated.slice(0, pruneCount);
        updated = updated.slice(pruneCount);
        for (const p of pruned) newIdSet.delete(p.id);
      }

      return {
        messages: { ...state.messages, [message.conversationId]: updated },
        messageIds: { ...state.messageIds, [message.conversationId]: newIdSet },
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
    set((state) => {
      const idSet = state.messageIds[conversationId];
      const newIdSet = idSet ? new Set(idSet) : new Set<string>();
      newIdSet.delete(messageId);
      return {
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).filter(
            (m) => m.id !== messageId
          ),
        },
        messageIds: { ...state.messageIds, [conversationId]: newIdSet },
      };
    });
  },

  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    });
  },

  addReactionToMessage: (messageId: string, emoji: string, userId: string, username?: string) => {
    set((state) => {
      const newMessages = { ...state.messages };
      for (const [convId, msgs] of Object.entries(newMessages)) {
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          const msg = msgs[idx];
          if (msg.reactions.some((r) => r.emoji === emoji && r.userId === userId)) return state;
          const newReaction: Reaction = {
            id: `${messageId}-${emoji}-${userId}`,
            emoji,
            userId,
            user: { id: userId, username: username || 'User' },
          };
          const updatedMsg = { ...msg, reactions: [...msg.reactions, newReaction] };
          newMessages[convId] = [...msgs.slice(0, idx), updatedMsg, ...msgs.slice(idx + 1)];
          return { messages: newMessages };
        }
      }
      return state;
    });
  },

  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => {
    set((state) => {
      const newMessages = { ...state.messages };
      for (const [convId, msgs] of Object.entries(newMessages)) {
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx !== -1) {
          const msg = msgs[idx];
          const updatedMsg = {
            ...msg,
            reactions: msg.reactions.filter((r) => !(r.emoji === emoji && r.userId === userId)),
          };
          newMessages[convId] = [...msgs.slice(0, idx), updatedMsg, ...msgs.slice(idx + 1)];
          return { messages: newMessages };
        }
      }
      return state;
    });
  },

  addConversation: (conversation: Conversation) => {
    set((state) => {
      if (state.conversations.some((c) => c.id === conversation.id)) return state;
      return { conversations: [conversation, ...state.conversations] };
    });
  },

  updateConversation: (updates: Partial<Conversation> & { id: string }) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === updates.id ? { ...c, ...updates } : c
      ),
    }));
  },

  // ── Helpers ────────────────────────────────────────────────────────

  getRecipientId: (conversationId: string, currentUserId: string): string | null => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv || conv.type !== 'direct') return null;
    const recipient = conv.participants.find((p) => p.userId !== currentUserId);
    return recipient?.userId || null;
  },

  sendTypingIndicator: (conversationId: string, isTyping: boolean) => {
    socketManager.sendTyping(`conversation:${conversationId}`, isTyping);
  },

  // ── WebSocket subscription for a conversation ──────────────────────

  subscribeToConversation: (conversationId: string): (() => void) => {
    const topic = `conversation:${conversationId}`;
    const store = get();

    // Join the channel
    socketManager.joinChannel(topic);

    // Listen for real-time events
    const unsubMessage = socketManager.onChannelMessage(topic, (event, payload) => {
      const data = payload as Record<string, unknown>;

      switch (event) {
        case 'new_message': {
          const msg = normalizeMessage(
            data.message ? (data.message as Record<string, unknown>) : data
          );
          useChatStore.getState().addMessage(msg);
          break;
        }
        case 'message_updated': {
          const msg = normalizeMessage(
            data.message ? (data.message as Record<string, unknown>) : data
          );
          useChatStore.getState().updateMessage(msg);
          break;
        }
        case 'message_deleted': {
          const msgId = (data.message_id || data.id) as string;
          if (msgId) useChatStore.getState().removeMessage(msgId, conversationId);
          break;
        }
        case 'typing': {
          const userId = (data.user_id || data.userId) as string;
          const isTyping = (data.typing ?? data.is_typing ?? false) as boolean;
          if (userId) useChatStore.getState().setTypingUser(conversationId, userId, isTyping);
          break;
        }
        case 'reaction_added': {
          const msgId = (data.message_id || data.messageId) as string;
          const emoji = data.emoji as string;
          const userId = (data.user_id || data.userId) as string;
          const username = (data.username || '') as string;
          if (msgId && emoji && userId) {
            useChatStore.getState().addReactionToMessage(msgId, emoji, userId, username);
          }
          break;
        }
        case 'reaction_removed': {
          const msgId = (data.message_id || data.messageId) as string;
          const emoji = data.emoji as string;
          const userId = (data.user_id || data.userId) as string;
          if (msgId && emoji && userId) {
            useChatStore.getState().removeReactionFromMessage(msgId, emoji, userId);
          }
          break;
        }
      }
    });

    // Cleanup: leave channel and unsubscribe
    return () => {
      unsubMessage();
      socketManager.leaveChannel(topic);
    };
  },
}));

// ── Selector hooks for convenience ───────────────────────────────────

export const useConversations = () => useChatStore((s) => s.conversations);
export const useActiveConversationId = () => useChatStore((s) => s.activeConversationId);
export const useIsLoadingConversations = () => useChatStore((s) => s.isLoadingConversations);
export const useIsLoadingMessages = () => useChatStore((s) => s.isLoadingMessages);

export default useChatStore;
