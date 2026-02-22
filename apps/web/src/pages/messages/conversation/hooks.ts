/**
 * Conversation-specific hooks
 * Extracted from Conversation.tsx for modularity
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket';
import { useChatStore } from '@/modules/chat/store';
import { useFriendStore } from '@/modules/social/store';
import { useAuthStore } from '@/modules/auth/store';
import { getParticipantUserId, getParticipantDisplayName } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { MutualFriend } from './types';

const logger = createLogger('ConversationHooks');

/**
 * Hook to manage participant information for a conversation
 */
export function useConversationParticipant(conversationId: string | undefined) {
  const { user } = useAuthStore();
  const conversations = useChatStore((state) => state.conversations);
  const { friends, fetchFriends } = useFriendStore();

  // Fetch friends list for mutual friends calculation
  useEffect(() => {
    if (friends.length === 0) {
      fetchFriends();
    }
  }, [friends.length, fetchFriends]);

  const conversation = conversations.find((c) => c.id === conversationId);

  // Get other participant for DM
  const otherParticipant = useMemo(() => {
    return conversation?.participants.find((p) => {
      const participantUserId = getParticipantUserId(p as unknown as Record<string, unknown>); // safe downcast – structural boundary
      return participantUserId !== user?.id;
    });
  }, [conversation?.participants, user?.id]);

  // Type-safe extraction of userId and display name
  const otherParticipantUserId =
    getParticipantUserId(otherParticipant as unknown as Record<string, unknown>) ?? undefined; // safe downcast – structural boundary
  const conversationName =
    conversation?.name ||
    getParticipantDisplayName(otherParticipant as unknown as Record<string, unknown>); // safe downcast – structural boundary

  // Calculate mutual friends from the friends list
  const mutualFriends = useMemo<MutualFriend[]>(() => {
    if (!otherParticipantUserId || friends.length === 0) return [];

    return friends.slice(0, 3).map((f) => ({
      id: f.id,
      username: f.displayName || f.username || 'Friend',
      avatarUrl: f.avatarUrl ?? undefined,
    }));
  }, [friends, otherParticipantUserId]);

  return {
    conversation,
    otherParticipant,
    otherParticipantUserId,
    conversationName,
    mutualFriends,
  };
}

/**
 * Hook to manage online presence status
 */
export function usePresenceStatus(
  conversationId: string | undefined,
  otherParticipantUserId: string | undefined
) {
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);

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

  return isOtherUserOnline;
}

/**
 * Hook to manage conversation channel connection and message fetching
 */
export function useConversationChannel(conversationId: string | undefined) {
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    let mounted = true;
    const abortController = new AbortController();

    setActiveConversation(conversationId);

    // Ensure socket is connected before joining conversation
    const initializeChannel = async () => {
      try {
        await socketManager.connect();
        if (mounted && !abortController.signal.aborted) {
          socketManager.joinConversation(conversationId);
        }
      } catch (err) {
        logger.warn('Socket connection failed:', err);
      }
    };

    initializeChannel();

    // Debounce rapid conversation switches
    const fetchTimeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        fetchMessages(conversationId);
        markAsRead(conversationId);
      }
    }, 50);

    return () => {
      mounted = false;
      abortController.abort();
      clearTimeout(fetchTimeoutId);
      setActiveConversation(null);

      // Clean up typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
      socketManager.leaveConversation(conversationId);
    };
  }, [conversationId, fetchMessages, markAsRead, setActiveConversation]);

  return { typingTimeoutRef };
}

/**
 * Hook to manage typing indicator
 */
export function useTypingIndicator(conversationId: string | undefined) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    const topic = `conversation:${conversationId}`;
    socketManager.sendTyping(topic, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.sendTyping(topic, false);
    }, 5000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketManager.sendTyping(`conversation:${conversationId}`, false);
  }, [conversationId]);

  return { handleTyping, stopTyping, typingTimeoutRef };
}

/**
 * Hook to auto-scroll to bottom on new messages
 */
export function useAutoScroll(messagesLength: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesLength]);

  return { messagesEndRef, messagesContainerRef };
}
