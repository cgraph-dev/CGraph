/**
 * Chat Store — Message Operations
 *
 * Message adding, updating, removing, editing, deletion,
 * and reaction handling (both API and socket-driven).
 *
 * @module modules/chat/store/chatStore.message-ops
 */

import { api } from '@/lib/api';
import { ensureObject, normalizeMessage } from '@/lib/apiUtils';
import { findConversationForMessage, updateMessageReactions } from './chatStore.utils';
import { useAuthStore } from '@/modules/auth/store';
import type { Message, Reaction, ChatState, EditHistory } from './chatStore.types';

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

/** Create message-related operations actions for the chat store. */
export function createMessageOpsActions(set: Set, get: Get) {
  return {
    editMessage: async (messageId: string, content: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      // Optimistic: add current content as edit history entry
      const currentMessage = (get().messages[conversationId] || []).find((m) => m.id === messageId);
      if (currentMessage) {
        const currentUserId = useAuthStore.getState().user?.id || '';
        const existingEdits = currentMessage.edits || [];
        const optimisticEdit: EditHistory = {
          id: `optimistic-${Date.now()}`,
          messageId,
          previousContent: currentMessage.content,
          editNumber: existingEdits.length + 1,
          editedById: currentUserId,
          createdAt: new Date().toISOString(),
        };
        get().updateMessage({
          ...currentMessage,
          content,
          isEdited: true,
          edits: [...existingEdits, optimisticEdit],
        });
      }

      const response = await api.patch(
        `/api/v1/conversations/${conversationId}/messages/${messageId}`,
        { content }
      );
      const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
      if (rawMessage) {
         
        const message = normalizeMessage(rawMessage) as unknown as Message; // type assertion: normalizer output type bridge
        get().updateMessage(message);
      }
    },

    deleteMessage: async (messageId: string) => {
      const conversationId = findConversationForMessage(get().messages, messageId);
      if (!conversationId) {
        throw new Error('Message not found in any conversation');
      }

      // Optimistic soft-delete: mark as deleted immediately
      get().markMessageDeleted(messageId);

      await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
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
        // Don't rollback on 422 — likely means reaction already exists on server
         
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 422 || status === 409) {
          // Optimistic state is correct, server already has this reaction
          return;
        }
        // Rollback on other errors (network, 5xx, etc.)
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
        // Don't rollback on 404/422 — reaction may already be removed on server
         
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 422) {
          return;
        }
        // Rollback on other errors
        set({ messages: previousMessages });
        throw error;
      }
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

    /** Soft-delete a message: mark as deleted without removing from the array. */
    markMessageDeleted: (messageId: string) => {
      set((state) => {
        const newMessages = { ...state.messages };
        for (const [convId, msgs] of Object.entries(newMessages)) {
          const idx = msgs.findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            const updated = [...msgs];
             
            updated[idx] = {
              ...updated[idx],
              deletedAt: new Date().toISOString(),
              content: '',
            } as Message;
            newMessages[convId] = updated;
            return { messages: newMessages };
          }
        }
        return state;
      });
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

    /** Update a message's delivery status in the conversation's message array. */
    updateMessageStatus: (
      conversationId: string,
      messageId: string,
      status: Message['deliveryStatus']
    ) => {
      set((state) => {
        const conversationMessages = state.messages[conversationId];
        if (!conversationMessages) return state;

        return {
          messages: {
            ...state.messages,
            [conversationId]: conversationMessages.map((m) =>
              m.id === messageId ? { ...m, deliveryStatus: status } : m
            ),
          },
        };
      });
    },

    /** Add a read receipt and update message status to 'read' if reader is the conversation partner. */
    addReadReceipt: (conversationId: string, messageId: string, userId: string, readAt: string) => {
      set((state) => {
        // Update readReceipts record
        const messageReceipts = state.readReceipts[messageId] || {};
        const updatedReceipts = {
          ...state.readReceipts,
          [messageId]: { ...messageReceipts, [userId]: readAt },
        };

        // Also update the message's deliveryStatus to 'read' if the reader is not the sender
        const conversationMessages = state.messages[conversationId];
        if (!conversationMessages) {
          return { readReceipts: updatedReceipts };
        }

        const currentUserId = useAuthStore.getState().user?.id;
        return {
          readReceipts: updatedReceipts,
          messages: {
            ...state.messages,
            [conversationId]: conversationMessages.map((m) => {
              if (m.id === messageId && m.senderId === currentUserId && userId !== currentUserId) {
                return { ...m, deliveryStatus: 'read' as const };
              }
              return m;
            }),
          },
        };
      });
    },
  };
}
