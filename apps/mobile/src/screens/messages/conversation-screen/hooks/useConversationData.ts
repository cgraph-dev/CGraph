/**
 * useConversationData Hook
 *
 * Manages fetching and processing conversation data and messages.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useCallback, useRef } from 'react';
import api from '../../../../lib/api';
import socketManager from '../../../../lib/socket';
import { normalizeMessages } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import { processMessagesWithReactions } from '../utils';
import type { Message, Conversation, ConversationParticipant, UserBasic } from '../../../../types';

const logger = createLogger('useConversationData');

interface UseConversationDataOptions {
  conversationId: string;
  userId: string | undefined;
  deletedMessageIdsRef: React.MutableRefObject<Set<string>>;
  onConversationLoaded?: (data: ConversationData) => void;
}

interface ConversationData {
  displayName: string;
  otherParticipantId: string | null;
  otherUser: UserBasic | null;
  lastSeen: string | null;
  isOnline: boolean;
}

interface UseConversationDataReturn {
  conversation: Conversation | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  isRefreshing: boolean;
  otherParticipantId: string | null;
  otherUser: UserBasic | null;
  fetchMessages: () => Promise<void>;
  fetchConversation: () => Promise<void>;
  onRefresh: () => Promise<void>;
  markMessageAsRead: (messageId: string) => void;
}

/**
 * Hook for fetching and managing conversation data.
 */
export function useConversationData({
  conversationId,
  userId,
  deletedMessageIdsRef,
  onConversationLoaded,
}: UseConversationDataOptions): UseConversationDataReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [otherParticipantId, setOtherParticipantId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<UserBasic | null>(null);

  const isMountedRef = useRef(true);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
      const rawMessages = response.data.data || response.data.messages || [];

      if (isMountedRef.current) {
        const normalized = normalizeMessages(rawMessages);
        const withReactions = processMessagesWithReactions(normalized, userId);

        // Deduplicate and filter out deleted messages
        const uniqueMessages = withReactions.reduce((acc: Message[], msg: Message) => {
          if (deletedMessageIdsRef.current.has(msg.id)) {
            return acc;
          }
          if (!acc.some((m) => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, []);

        // Sort messages reverse chronologically (newest first) for inverted list
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const dateA = new Date(a.inserted_at).getTime();
          const dateB = new Date(b.inserted_at).getTime();
          return dateB - dateA;
        });

        setMessages(sortedMessages);

        // Mark latest unread message as read
        const latestUnread = sortedMessages.find((m) => m.sender_id !== userId);
        if (latestUnread) {
          markMessageAsRead(latestUnread.id);
        }
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId, userId]);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await api.get(`/api/v1/conversations/${conversationId}`);
      const conv = response.data.data || response.data;
      setConversation(conv);

      // Find other participant
      const otherParticipant = conv.participants?.find((p: ConversationParticipant) => {
        const participantUserId =
           
          p.userId || p.user_id || (p.user as Record<string, unknown>)?.id || p.id;
        return String(participantUserId) !== String(userId);
      });

      // Extract other participant's ID
      const rawOtherUserId =
        otherParticipant?.userId ||
        otherParticipant?.user_id ||
         
        (otherParticipant?.user as Record<string, unknown>)?.id;
      const extractedOtherUserId = rawOtherUserId ? String(rawOtherUserId) : null;

      if (extractedOtherUserId) {
        setOtherParticipantId(extractedOtherUserId);

        // Build other user info
        const otherUserInfo: UserBasic = {
          id: extractedOtherUserId,
          username:
             
            (otherParticipant?.user as Record<string, unknown>)?.username ||
            otherParticipant?.username ||
            null,
          display_name:
             
            (otherParticipant?.user as Record<string, unknown>)?.displayName ||
             
            (otherParticipant?.user as Record<string, unknown>)?.display_name ||
            null,
          avatar_url:
             
            (otherParticipant?.user as Record<string, unknown>)?.avatarUrl ||
             
            (otherParticipant?.user as Record<string, unknown>)?.avatar_url ||
            null,
          status: 'offline',
        };
        setOtherUser(otherUserInfo);

        // Extract display name
        const displayName =
          conv.name ||
          otherParticipant?.nickname ||
           
          (otherParticipant?.user as Record<string, unknown>)?.displayName ||
           
          (otherParticipant?.user as Record<string, unknown>)?.display_name ||
          otherParticipant?.displayName ||
          otherParticipant?.display_name ||
           
          (otherParticipant?.user as Record<string, unknown>)?.username ||
          otherParticipant?.username ||
          'Conversation';

        // Extract last seen
         
        const lastSeen = (otherParticipant?.user as Record<string, unknown>)?.lastSeenAt || null;

        // Check presence
        const isOnline =
          socketManager.isFriendOnline(extractedOtherUserId) ||
          socketManager.isUserOnline(conversationId, extractedOtherUserId);

        // Notify parent with extracted data
        onConversationLoaded?.({
          displayName,
          otherParticipantId: extractedOtherUserId,
          otherUser: otherUserInfo,
           
          lastSeen: lastSeen as string | null,
          isOnline,
        });
      }
    } catch (error) {
      logger.error('Error fetching conversation:', error);
    }
  }, [conversationId, userId, onConversationLoaded]);

  // Mark message as read via WebSocket
  const markMessageAsRead = useCallback(
    (messageId: string) => {
      const channel = socketManager.getChannel(`conversation:${conversationId}`);
      if (channel) {
        channel.push('mark_read', { message_id: messageId });
      }
    },
    [conversationId]
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchMessages();
      await fetchConversation();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMessages, fetchConversation]);

  return {
    conversation,
    messages,
    setMessages,
    isLoading,
    isRefreshing,
    otherParticipantId,
    otherUser,
    fetchMessages,
    fetchConversation,
    onRefresh,
    markMessageAsRead,
  };
}

export default useConversationData;
