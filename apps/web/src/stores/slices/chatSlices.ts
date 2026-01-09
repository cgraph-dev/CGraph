/**
 * Zustand Slices Pattern - Chat Store Slices
 * 
 * This file defines the slice pattern for the chat store, enabling better
 * separation of concerns and code organization. Each slice handles a
 * specific domain of the chat functionality.
 * 
 * @module stores/slices/chat
 * @since v0.7.29
 */

import type { StateCreator } from 'zustand';
import type { Message, Conversation, TypingUserInfo, Reaction } from '../chatStore';

// ============================================================================
// Slice Types
// ============================================================================

/**
 * Conversations slice - manages conversation list and selection
 */
export interface ConversationsSlice {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversationId: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: string) => void;
  setLoadingConversations: (loading: boolean) => void;
}

/**
 * Messages slice - manages message lists per conversation
 */
export interface MessagesSlice {
  messages: Record<string, Message[]>;
  isLoadingMessages: boolean;
  hasMoreMessages: Record<string, boolean>;
  
  // Actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (message: Partial<Message> & { id: string; conversationId: string }) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;
}

/**
 * Typing slice - manages typing indicators
 */
export interface TypingSlice {
  typingUsers: Record<string, string[]>;
  typingUsersInfo: Record<string, TypingUserInfo[]>;
  
  // Actions
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean, startedAt?: string) => void;
  clearTypingUsers: (conversationId: string) => void;
}

/**
 * Reactions slice - manages message reactions
 */
export interface ReactionsSlice {
  // Reactions are stored within messages, but this slice handles reaction operations
  addReactionOptimistic: (messageId: string, conversationId: string, emoji: string, userId: string, username: string) => void;
  removeReactionOptimistic: (messageId: string, conversationId: string, emoji: string, userId: string) => void;
}

/**
 * Combined chat store type
 */
export type ChatStore = ConversationsSlice & MessagesSlice & TypingSlice & ReactionsSlice;

// ============================================================================
// Slice Creators
// ============================================================================

/**
 * Creates the conversations slice
 */
export const createConversationsSlice: StateCreator<
  ChatStore,
  [],
  [],
  ConversationsSlice
> = (set) => ({
  conversations: [],
  activeConversationId: null,
  isLoadingConversations: false,

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
  
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter(c => c.id !== conversation.id)],
    })),
  
  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...updates } : c
      ),
    })),
  
  removeConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
    })),
  
  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
});

/**
 * Creates the messages slice
 */
export const createMessagesSlice: StateCreator<
  ChatStore,
  [],
  [],
  MessagesSlice
> = (set) => ({
  messages: {},
  isLoadingMessages: false,
  hasMoreMessages: {},

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  
  addMessage: (message) =>
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
      };
    }),
  
  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] || [])],
      },
    })),
  
  updateMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (state.messages[message.conversationId] || []).map((m) =>
          m.id === message.id ? { ...m, ...message } : m
        ),
      },
    })),
  
  removeMessage: (messageId, conversationId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),
  
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  
  setHasMore: (conversationId, hasMore) =>
    set((state) => ({
      hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: hasMore },
    })),
});

/**
 * Creates the typing slice
 */
export const createTypingSlice: StateCreator<
  ChatStore,
  [],
  [],
  TypingSlice
> = (set) => ({
  typingUsers: {},
  typingUsersInfo: {},

  setTypingUser: (conversationId, userId, isTyping, startedAt) =>
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];
      const currentTypingInfo = state.typingUsersInfo[conversationId] || [];

      if (isTyping) {
        // Add user if not already typing
        if (!currentTyping.includes(userId)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...currentTyping, userId],
            },
            typingUsersInfo: {
              ...state.typingUsersInfo,
              [conversationId]: [...currentTypingInfo, { userId, startedAt }],
            },
          };
        }
      } else {
        // Remove user
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: currentTyping.filter((id) => id !== userId),
          },
          typingUsersInfo: {
            ...state.typingUsersInfo,
            [conversationId]: currentTypingInfo.filter((info) => info.userId !== userId),
          },
        };
      }

      return state;
    }),

  clearTypingUsers: (conversationId) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: [] },
      typingUsersInfo: { ...state.typingUsersInfo, [conversationId]: [] },
    })),
});

/**
 * Creates the reactions slice
 */
export const createReactionsSlice: StateCreator<
  ChatStore,
  [],
  [],
  ReactionsSlice
> = (set) => ({
  addReactionOptimistic: (messageId, conversationId, emoji, userId, username) =>
    set((state) => {
      const messages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) => {
            if (m.id !== messageId) return m;

            const existingReaction = m.reactions.find((r) => r.emoji === emoji);
            if (existingReaction) {
              // Add user to existing reaction if not already there
              if (existingReaction.userId === userId) return m;
              // For simplicity, we'll create a new reaction entry
            }

            const newReaction: Reaction = {
              id: `temp-${Date.now()}`,
              emoji,
              userId,
              user: { id: userId, username },
            };

            return {
              ...m,
              reactions: [...m.reactions, newReaction],
            };
          }),
        },
      };
    }),

  removeReactionOptimistic: (messageId, conversationId, emoji, userId) =>
    set((state) => {
      const messages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) => {
            if (m.id !== messageId) return m;

            return {
              ...m,
              reactions: m.reactions.filter(
                (r) => !(r.emoji === emoji && r.userId === userId)
              ),
            };
          }),
        },
      };
    }),
});
