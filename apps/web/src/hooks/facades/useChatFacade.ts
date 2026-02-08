/**
 * Chat Facade Hook
 *
 * Discord-style composition hook that aggregates chat store,
 * effects store, and bubble store into a single domain interface.
 *
 * Provides a unified API for conversations, messages, typing indicators,
 * reactions, E2EE state, and visual effects — without exposing store internals.
 *
 * @example
 * ```tsx
 * const {
 *   conversations,
 *   activeMessages,
 *   sendMessage,
 *   setActiveConversation,
 * } = useChatFacade();
 * ```
 *
 * @module hooks/facades/useChatFacade
 */

import { useMemo } from 'react';
import {
  useChatStore,
  useChatEffectsStore,
  useChatBubbleStore,
  type Conversation,
  type Message,
  type MessageEffectConfig,
} from '@/modules/chat/store';
import type { ChatBubbleConfig } from '@/stores/theme';

export interface ChatFacade {
  // Conversation state
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;

  // Message state
  activeMessages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;

  // Typing
  typingUsers: Record<string, string[]>;

  // Actions — Conversations
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  createConversation: (userIds: string[]) => Promise<Conversation>;

  // Actions — Messages
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: { type?: string; metadata?: Record<string, unknown>; forceUnencrypted?: boolean }
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;

  // Actions — Reactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;

  // Actions — Typing
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
    startedAt?: string
  ) => void;

  // Effects — read-only derived state
  activeEffect: MessageEffectConfig;
  activeBubbleStyle: ChatBubbleConfig;
}

/**
 * Composes chat domain state from chatStore, chatEffectsStore, chatBubbleStore.
 */
export function useChatFacade(): ChatFacade {
  // Chat store — primitive selectors
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) => s.messages);
  const isLoadingConversations = useChatStore((s) => s.isLoadingConversations);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMoreMessagesMap = useChatStore((s) => s.hasMoreMessages);
  const typingUsers = useChatStore((s) => s.typingUsers);

  // Chat store — actions
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const setTypingUser = useChatStore((s) => s.setTypingUser);

  // Effects store — read-only
  const activeEffect = useChatEffectsStore((s) => s.activeMessageEffect);
  const activeBubbleStyle = useChatBubbleStore().style;

  // Derived: messages for the active conversation
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  const hasMoreMessages = activeConversationId
    ? (hasMoreMessagesMap[activeConversationId] ?? true)
    : false;

  return useMemo(
    () => ({
      conversations,
      activeConversationId,
      isLoadingConversations,
      activeMessages,
      isLoadingMessages,
      hasMoreMessages,
      typingUsers,
      fetchConversations,
      setActiveConversation,
      createConversation,
      fetchMessages,
      sendMessage,
      deleteMessage,
      editMessage,
      addReaction,
      removeReaction,
      setTypingUser,
      activeEffect,
      activeBubbleStyle,
    }),
    [
      conversations,
      activeConversationId,
      isLoadingConversations,
      activeMessages,
      isLoadingMessages,
      hasMoreMessages,
      typingUsers,
      fetchConversations,
      setActiveConversation,
      createConversation,
      fetchMessages,
      sendMessage,
      deleteMessage,
      editMessage,
      addReaction,
      removeReaction,
      setTypingUser,
      activeEffect,
      activeBubbleStyle,
    ]
  );
}
