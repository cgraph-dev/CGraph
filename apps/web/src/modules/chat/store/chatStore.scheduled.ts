/**
 * Chat Store — Scheduled Messages Actions
 *
 * Fetch, schedule, cancel, and reschedule messages.
 *
 * @module modules/chat/store/chatStore.scheduled
 */

import { api } from '@/lib/api';
import { ensureArray, normalizeMessage } from '@/lib/apiUtils';
import { chatLogger as logger } from '@/lib/logger';
import type { Message, ChatState } from './chatStore.types';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

/** Create scheduled message actions for the chat store. */
export function createScheduledActions(set: Set, _get: Get) {
  return {
    /** Fetch scheduled messages for a conversation */
    fetchScheduledMessages: async (conversationId: string) => {
      set({ isLoadingScheduledMessages: true });
      try {
        const response = await api.get(`/conversations/${conversationId}/scheduled-messages`);
        const scheduledMessages = ensureArray<Message>(response.data?.messages || response.data);

        set((state) => ({
          scheduledMessages: {
            ...state.scheduledMessages,
            [conversationId]: scheduledMessages,
          },
          isLoadingScheduledMessages: false,
        }));
      } catch (error: unknown) {
        logger.error('Failed to fetch scheduled messages:', error);
        set({ isLoadingScheduledMessages: false });
        throw error;
      }
    },

    /** Schedule a message for future delivery */
    scheduleMessage: async (
      conversationId: string,
      content: string,
      scheduledAt: Date,
      options: { type?: string; metadata?: Record<string, unknown>; replyToId?: string } = {}
    ) => {
      try {
        const payload: {
          content: string;
          content_type: string;
          scheduled_at: string;
          reply_to_id?: string;
          metadata?: Record<string, unknown>;
        } = {
          content,
          content_type: options.type || 'text',
          scheduled_at: scheduledAt.toISOString(),
        };

        if (options.replyToId) {
          payload.reply_to_id = options.replyToId;
        }

        if (options.metadata) {
          payload.metadata = options.metadata;
        }

        const response = await api.post(`/conversations/${conversationId}/messages`, payload);

         
        const scheduledMessage = normalizeMessage(
          response.data?.message || response.data
        ) as unknown as Message; // type assertion: normalizer output type bridge

        set((state) => {
          const existingScheduled = state.scheduledMessages[conversationId] || [];
          return {
            scheduledMessages: {
              ...state.scheduledMessages,
              [conversationId]: [...existingScheduled, scheduledMessage].slice(-50),
            },
          };
        });

        logger.info('Message scheduled successfully:', scheduledMessage.id);
      } catch (error: unknown) {
        logger.error('Failed to schedule message:', error);
        throw error;
      }
    },

    /** Cancel a scheduled message */
    cancelScheduledMessage: async (messageId: string) => {
      try {
        await api.delete(`/messages/${messageId}/cancel-schedule`);

        set((state) => {
          const updatedScheduledMessages: Record<string, Message[]> = {};
          Object.entries(state.scheduledMessages).forEach(([convId, messages]) => {
            updatedScheduledMessages[convId] = messages.filter((m) => m.id !== messageId);
          });
          return { scheduledMessages: updatedScheduledMessages };
        });

        logger.info('Scheduled message cancelled:', messageId);
      } catch (error: unknown) {
        logger.error('Failed to cancel scheduled message:', error);
        throw error;
      }
    },

    /** Reschedule a message to a new time */
    rescheduleMessage: async (messageId: string, newScheduledAt: Date) => {
      try {
        const response = await api.patch(`/messages/${messageId}/reschedule`, {
          scheduled_at: newScheduledAt.toISOString(),
        });

         
        const updatedMessage = normalizeMessage(
          response.data?.message || response.data
        ) as unknown as Message; // type assertion: normalizer output type bridge

        set((state) => {
          const updatedScheduledMessages: Record<string, Message[]> = {};
          Object.entries(state.scheduledMessages).forEach(([convId, messages]) => {
            updatedScheduledMessages[convId] = messages.map((m) =>
              m.id === messageId ? updatedMessage : m
            );
          });
          return { scheduledMessages: updatedScheduledMessages };
        });

        logger.info('Message rescheduled:', messageId);
      } catch (error: unknown) {
        logger.error('Failed to reschedule message:', error);
        throw error;
      }
    },
  };
}
