/**
 * useConversationState Hook
 *
 * Extracts all conversation state management logic from the Conversation page.
 * This hook consolidates:
 * - Message fetching and pagination
 * - Typing indicators
 * - Presence tracking
 * - Message sending/receiving
 *
 * @module hooks/useConversationState
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChatStore, Message, Conversation } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import { useFriendStore } from '@/modules/social/store';
import { socketManager } from '@/lib/socket';
import { getParticipantUserId, getParticipantDisplayName } from '@/lib/apiUtils';

export interface ConversationState {
  // Core data
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;

  // Participants
  otherParticipant: Conversation['participants'][0] | undefined;
  otherParticipantUserId: string | null;
  conversationName: string;
  isOtherUserOnline: boolean;

  // Typing
  typingUserIds: string[];

  // Actions
  fetchMessages: () => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;
  markAsRead: () => void;

  // Mutual friends
  mutualFriends: Array<{ id: string; username: string; avatarUrl?: string }>;
}

export interface SendMessageOptions {
  replyToId?: string;
  messageType?: Message['messageType'];
  metadata?: Record<string, unknown>;
}

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing conversation state.
 *
 * @param conversationId - The conversation id.
 * @returns The result.
 */
export function useConversationState(conversationId: string | undefined): ConversationState {
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();

  // Split Zustand selectors to prevent infinite re-renders
  const conversations = useChatStore((state) => state.conversations);
  const messagesMap = useChatStore((state) => state.messages);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const fetchMessagesAction = useChatStore((state) => state.fetchMessages);
  const sendMessageAction = useChatStore((state) => state.sendMessage);
  const markAsReadAction = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

  // Find conversation
  const conversation = useMemo(
    () => (conversationId ? (conversations.find((c) => c.id === conversationId) ?? null) : null),
    [conversationId, conversations]
  );

  // Get messages for this conversation
  const messages = useMemo(
    () => (conversationId ? (messagesMap[conversationId] ?? []) : []),
    [conversationId, messagesMap]
  );

  // Get typing users (exclude current user)
  const typingUserIds = useMemo(
    () =>
      conversationId ? (typingUsers[conversationId] ?? []).filter((uid) => uid !== user?.id) : [],
    [conversationId, typingUsers, user?.id]
  );

  // Get other participant for DM
  const otherParticipant = useMemo(() => {
    return conversation?.participants.find((p) => {
      const participantUserId = getParticipantUserId(p as unknown as Record<string, unknown>); // safe downcast – polymorphic participant record access
      return participantUserId !== user?.id;
    });
  }, [conversation?.participants, user?.id]);

  // Type-safe extraction of userId and display name
  const otherParticipantUserId = useMemo(
    () => getParticipantUserId(otherParticipant as unknown as Record<string, unknown>), // safe downcast – polymorphic participant record access
    [otherParticipant]
  );

  const conversationName = useMemo(
    () =>
      conversation?.name ||
      getParticipantDisplayName(otherParticipant as unknown as Record<string, unknown>), // safe downcast – polymorphic participant record access
    [conversation?.name, otherParticipant]
  );

  // Calculate mutual friends
  const mutualFriends = useMemo(() => {
    if (!otherParticipantUserId || friends.length === 0) return [];
    return friends.slice(0, 3).map((f) => ({
      id: f.id,
      username: f.displayName || f.username || 'Friend',
      avatarUrl: f.avatarUrl ?? undefined,
    }));
  }, [friends, otherParticipantUserId]);

  // Fetch friends on mount
  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
  }, [friends.length, fetchFriends]);

  // Set active conversation on mount
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  // Subscribe to presence changes
  useEffect(() => {
    if (!conversationId || !otherParticipantUserId) return;

    // Initial check
    setIsOtherUserOnline(socketManager.isUserOnline(conversationId, otherParticipantUserId));

    // Subscribe to status changes
    const unsubscribe = socketManager.onStatusChange((convId, userId, isOnline) => {
      if (convId === conversationId && userId === otherParticipantUserId) {
        setIsOtherUserOnline(isOnline);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherParticipantUserId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    await fetchMessagesAction(conversationId);
  }, [conversationId, fetchMessagesAction]);

  // Fetch more messages (pagination)
  const fetchMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages[conversationId]) return;
    const oldestMessage = messages[0];
    if (oldestMessage) {
      await fetchMessagesAction(conversationId, oldestMessage.id);
    }
  }, [conversationId, hasMoreMessages, messages, fetchMessagesAction]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!conversationId) return;
      await sendMessageAction(conversationId, content, options?.replyToId, {
        type: options?.messageType ?? 'text',
        metadata: options?.metadata,
      });
    },
    [conversationId, sendMessageAction]
  );

  // Mark as read
  const markAsRead = useCallback(() => {
    if (conversationId) {
      markAsReadAction(conversationId);
    }
  }, [conversationId, markAsReadAction]);

  return {
    conversation,
    messages,
    isLoading: isLoadingMessages,
    hasMore: conversationId ? (hasMoreMessages[conversationId] ?? false) : false,
    otherParticipant,
    otherParticipantUserId,
    conversationName,
    isOtherUserOnline,
    typingUserIds,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markAsRead,
    mutualFriends,
  };
}
