/**
 * Chat Store — Operations Actions
 *
 * Message editing, deletion, reactions, typing indicators,
 * conversation management, and state management.
 *
 * @module modules/chat/store/chatStore.operations
 */

import { api } from '@/lib/api';
import { ensureObject, normalizeMessage } from '@/lib/apiUtils';
import { findConversationForMessage, updateMessageReactions } from './chatStore.utils';
import { useAuthStore } from '@/modules/auth/store';
import type { Message, Conversation, Reaction, ChatState } from './chatStore.types';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

/**
 * Maximum number of messages kept in memory per conversation.
 * When exceeded, the oldest messages are pruned from the front of the array.
 * Users can still fetch older messages via "Load more" (cursor-based pagination).
 */
const MAX_MESSAGES_PER_CONVERSATION = 500;

/** Create operations actions for the chat store. */
export function createOperationsActions(set: Set, get: Get) {
  return {
    editMessage: async (messageId: string, content: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      const response = await api.patch(
        `/api/v1/conversations/${conversationId}/messages/${messageId}`,
        { content }
      );
      const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
      if (rawMessage) {
        const message = normalizeMessage(rawMessage) as unknown as Message;
        get().updateMessage(message);
      }
    },

    deleteMessage: async (messageId: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
      get().removeMessage(messageId, conversationId);
    },

    addReaction: async (messageId: string, emoji: string) => {
      // Optimistic update: add reaction to state before API call
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id || '';
      const username = currentUser?.username || 'User';
      const previousMessages = { ...get().messages };

      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) => {
          const alreadyExists = reactions.some((r) => r.emoji === emoji && r.userId === userId);
          if (alreadyExists) return reactions;
          const newReaction: Reaction = {
            id: `${messageId}-${emoji}-${userId}`,
            emoji,
            userId,
            user: { id: userId, username },
          };
          return [...reactions, newReaction];
        });
        return { messages: { ...state.messages, ...updatedMessages } };
      });

      try {
        await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      } catch (error: unknown) {
        // Rollback on error
        set({ messages: previousMessages });
        throw error;
      }
    },

    removeReaction: async (messageId: string, emoji: string) => {
      // Optimistic update: remove reaction from state before API call
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id || '';
      const previousMessages = { ...get().messages };

      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) =>
          reactions.filter((r) => !(r.emoji === emoji && r.userId === userId))
        );
        return { messages: { ...state.messages, ...updatedMessages } };
      });

      try {
        await api.delete(`/api/v1/messages/${messageId}/reactions/${emoji}`);
      } catch (error: unknown) {
        // Rollback on error
        set({ messages: previousMessages });
        throw error;
      }
    },

    setActiveConversation: (conversationId: string | null) => {
      set({ activeConversationId: conversationId });
    },

    addMessage: (message: Message) => {
      // Use queueMicrotask to batch rapid message updates
      queueMicrotask(() => {
        set((state) => {
          const conversationMessages = state.messages[message.conversationId] || [];
          const idSet = state.messageIdSets[message.conversationId] || new Set<string>();

          // O(1) deduplication check
          if (idSet.has(message.id)) {
            return state;
          }

          const newIdSet = new Set(idSet);
          newIdSet.add(message.id);

          // Append the new message
          let updatedMessages = [...conversationMessages, message];

          // Prune oldest messages if we exceed the cap
          if (updatedMessages.length > MAX_MESSAGES_PER_CONVERSATION) {
            const pruneCount = updatedMessages.length - MAX_MESSAGES_PER_CONVERSATION;
            const pruned = updatedMessages.slice(0, pruneCount);
            updatedMessages = updatedMessages.slice(pruneCount);
            // Remove pruned IDs from the dedup set
            for (const p of pruned) {
              newIdSet.delete(p.id);
            }
          }

          // Only update lastMessage if this is the newest message
          const shouldUpdateLastMessage =
            !state.conversations.find((c) => c.id === message.conversationId)?.lastMessage ||
            new Date(message.createdAt) >
              new Date(
                state.conversations.find((c) => c.id === message.conversationId)?.lastMessage
                  ?.createdAt || 0
              );

          return {
            messages: {
              ...state.messages,
              [message.conversationId]: updatedMessages,
            },
            messageIdSets: {
              ...state.messageIdSets,
              [message.conversationId]: newIdSet,
            },
            conversations: shouldUpdateLastMessage
              ? state.conversations.map((conv) =>
                  conv.id === message.conversationId
                    ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
                    : conv
                )
              : state.conversations,
          };
        });
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
        const idSet = state.messageIdSets[conversationId];
        if (idSet) {
          const newIdSet = new Set(idSet);
          newIdSet.delete(messageId);
          return {
            messages: {
              ...state.messages,
              [conversationId]: (state.messages[conversationId] || []).filter(
                (m) => m.id !== messageId
              ),
            },
            messageIdSets: {
              ...state.messageIdSets,
              [conversationId]: newIdSet,
            },
          };
        }
        return {
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(
              (m) => m.id !== messageId
            ),
          },
        };
      });
    },

    setTypingUser: (
      conversationId: string,
      userId: string,
      isTyping: boolean,
      startedAt?: string
    ) => {
      set((state) => {
        const currentIds = state.typingUsers[conversationId] || [];
        const currentInfo = state.typingUsersInfo[conversationId] || [];

        const updatedIds = isTyping
          ? [...new Set([...currentIds, userId])]
          : currentIds.filter((id) => id !== userId);

        const updatedInfo = isTyping
          ? [...currentInfo.filter((u) => u.userId !== userId), { userId, startedAt }]
          : currentInfo.filter((u) => u.userId !== userId);

        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: updatedIds,
          },
          typingUsersInfo: {
            ...state.typingUsersInfo,
            [conversationId]: updatedInfo,
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
      } catch (_error) {
        // Ignore read receipt errors
      }
    },

    createConversation: async (userIds: string[]) => {
      const response = await api.post('/api/v1/conversations', {
        participant_ids: userIds,
      });
      const conversation = ensureObject<Conversation>(response.data, 'conversation');
      if (conversation) {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }));
        return conversation;
      }
      throw new Error('Failed to create conversation');
    },

    /** Add a new conversation from real-time socket event */
    addConversation: (conversation: Conversation) => {
      set((state) => {
        if (state.conversations.some((c) => c.id === conversation.id)) {
          return state;
        }
        return {
          conversations: [conversation, ...state.conversations],
        };
      });
    },

    /** Update an existing conversation from real-time socket event */
    updateConversation: (updates: Partial<Conversation> & { id: string }) => {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === updates.id ? { ...conv, ...updates } : conv
        ),
      }));
    },

    /** Get the recipient ID for a direct conversation */
    getRecipientId: (conversationId: string, currentUserId: string): string | null => {
      const { conversations } = get();
      const conversation = conversations.find((c) => c.id === conversationId);

      if (!conversation || conversation.type !== 'direct') {
        return null;
      }

      const recipient = conversation.participants.find((p) => p.userId !== currentUserId);
      return recipient?.userId || null;
    },

    /** Add a reaction to a message (from socket event) */
    addReactionToMessage: (messageId: string, emoji: string, userId: string, username?: string) => {
      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) => {
          const alreadyExists = reactions.some((r) => r.emoji === emoji && r.userId === userId);
          if (alreadyExists) return reactions;

          const newReaction: Reaction = {
            id: `${messageId}-${emoji}-${userId}`,
            emoji,
            userId,
            user: { id: userId, username: username || 'User' },
          };
          return [...reactions, newReaction];
        });
        return { messages: { ...state.messages, ...updatedMessages } };
      });
    },

    /** Remove a reaction from a message (from socket event) */
    removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => {
      set((state) => {
        const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) =>
          reactions.filter((r) => !(r.emoji === emoji && r.userId === userId))
        );
        return { messages: { ...state.messages, ...updatedMessages } };
      });
    },
  };
}
