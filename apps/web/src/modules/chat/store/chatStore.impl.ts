/**
 * Chat Store — Implementation (Orchestrator)
 *
 * Composes all chat store action slices into a single Zustand store.
 * Each domain (core fetching, messaging/E2EE, operations, scheduled)
 * lives in its own file for maintainability.
 *
 * @module stores/chatStore
 * @version 1.0.0
 * @since v0.1.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/lib/api';
import { ensureArray, normalizeMessage, normalizeConversations } from '@/lib/apiUtils';
import type { Message, Conversation, ChatState } from './chatStore.types';
import { createMessagingActions } from './chatStore.messaging';
import { createOperationsActions } from './chatStore.operations';
import { createScheduledActions } from './chatStore.scheduled';

// Re-export all types for backward compatibility
export type {
  Message,
  MessageMetadata,
  Reaction,
  Conversation,
  ConversationParticipant,
  TypingUserInfo,
  ChatState,
} from './chatStore.types';

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────
      conversations: [],
      activeConversationId: null,
      messages: {},
      messageIdSets: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      typingUsers: {},
      typingUsersInfo: {},
      hasMoreMessages: {},
      conversationsLastFetchedAt: null,
      scheduledMessages: {},
      isLoadingScheduledMessages: false,
      readReceipts: {},

      // ── Core Fetch Actions ─────────────────────────────────────────

      fetchConversations: async () => {
        const { conversationsLastFetchedAt, isLoadingConversations } = get();
        const now = Date.now();
        const CACHE_TTL = 30000; // 30 seconds

        if (isLoadingConversations) return;
        if (conversationsLastFetchedAt && now - conversationsLastFetchedAt < CACHE_TTL) {
          return;
        }

        set({ isLoadingConversations: true });
        try {
          const response = await api.get('/api/v1/conversations');
          const rawConversations = ensureArray<Record<string, unknown>>(
            response.data,
            'conversations'
          );
           
          const normalizedConversations = normalizeConversations(
            rawConversations
          ) as unknown as Conversation[]; // type assertion: normalizer output type bridge
          set({
            conversations: normalizedConversations,
            isLoadingConversations: false,
            conversationsLastFetchedAt: now,
          });
        } catch (error: unknown) {
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
          const rawMessages = ensureArray<Record<string, unknown>>(response.data, 'messages');
           
          const newMessages = rawMessages.map((m) => normalizeMessage(m)) as unknown as Message[]; // type assertion: normalizer output type bridge
          const hasMore = newMessages.length === 50;

          set((state) => {
            const existingIds = state.messageIdSets[conversationId] || new Set<string>();
            const newIdSet = new Set(existingIds);
            newMessages.forEach((m) => newIdSet.add(m.id));

            // Merge messages: prepend if loading older, replace if initial fetch
            let mergedMessages = before
              ? [...newMessages, ...(state.messages[conversationId] || [])]
              : newMessages;

            // Enforce MAX_MESSAGES_PER_CONVERSATION to prevent unbounded memory growth.
            // When scrolling up through history, prune from the END (newest).
            // When loading fresh, prune from the START (oldest) — same as addMessage.
            const MAX_MESSAGES = 500;
            if (mergedMessages.length > MAX_MESSAGES) {
              if (before) {
                // User is scrolling up — keep oldest, prune newest (they'll re-fetch on scroll down)
                const pruneCount = mergedMessages.length - MAX_MESSAGES;
                const pruned = mergedMessages.slice(mergedMessages.length - pruneCount);
                mergedMessages = mergedMessages.slice(0, MAX_MESSAGES);
                for (const p of pruned) {
                  newIdSet.delete(p.id);
                }
              } else {
                // Initial load — keep newest, prune oldest
                const pruneCount = mergedMessages.length - MAX_MESSAGES;
                const pruned = mergedMessages.slice(0, pruneCount);
                mergedMessages = mergedMessages.slice(pruneCount);
                for (const p of pruned) {
                  newIdSet.delete(p.id);
                }
              }
            }

            return {
              messages: {
                ...state.messages,
                [conversationId]: mergedMessages,
              },
              messageIdSets: {
                ...state.messageIdSets,
                [conversationId]: newIdSet,
              },
              hasMoreMessages: {
                ...state.hasMoreMessages,
                [conversationId]: hasMore,
              },
              isLoadingMessages: false,
            };
          });
        } catch (error: unknown) {
          set({ isLoadingMessages: false });
          throw error;
        }
      },

      // ── Composed Slices ────────────────────────────────────────────
      ...createMessagingActions(set, get),
      ...createOperationsActions(set, get),
      ...createScheduledActions(set, get),

      reset: () =>
        set({
          conversations: [],
          activeConversationId: null,
          messages: {},
          messageIdSets: {},
          isLoadingConversations: false,
          isLoadingMessages: false,
          typingUsers: {},
          typingUsersInfo: {},
          hasMoreMessages: {},
          conversationsLastFetchedAt: null,
          scheduledMessages: {},
          isLoadingScheduledMessages: false,
          readReceipts: {},
        }),
    }),
    {
      name: 'ChatStore',
      enabled: import.meta.env.DEV,
    }
  )
);
