/**
 * usePresence Hook
 *
 * Manages online status and typing indicator state for conversation participants.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import socketManager from '../../../../lib/socket';

interface UsePresenceOptions {
  conversationId: string;
  otherParticipantId: string | null;
}

interface UsePresenceReturn {
  isOtherUserOnline: boolean;
  isOtherUserTyping: boolean;
  otherParticipantLastSeen: string | null;
  setOtherParticipantLastSeen: (lastSeen: string | null) => void;
  handleTextChange: (text: string, setInputText: (text: string) => void) => void;
  stopTypingIndicator: () => void;
}

/**
 * Hook for managing presence and typing indicators.
 */
export function usePresence({
  conversationId,
  otherParticipantId,
}: UsePresenceOptions): UsePresenceReturn {
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [otherParticipantLastSeen, setOtherParticipantLastSeen] = useState<string | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to presence changes
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;

    // Initial check
    const isOnline =
      socketManager.isFriendOnline(otherParticipantId) ||
      socketManager.isUserOnline(conversationId, otherParticipantId);
    setIsOtherUserOnline(isOnline);

    // Subscribe to conversation-level status changes
    const unsubscribeConv = socketManager.onStatusChange((convId, participantId, online) => {
      if (convId === conversationId && participantId === otherParticipantId) {
        setIsOtherUserOnline(online);
      }
    });

    // Subscribe to global friend status changes
    const unsubscribeGlobal = socketManager.onGlobalStatusChange((userId, online) => {
      if (userId === otherParticipantId) {
        setIsOtherUserOnline(online);
      }
    });

    return () => {
      unsubscribeConv();
      unsubscribeGlobal();
    };
  }, [conversationId, otherParticipantId]);

  // Subscribe to typing indicator changes
  useEffect(() => {
    if (!conversationId || !otherParticipantId) return;

    // Initial check for any typing users
    const typingUsers = socketManager.getTypingUsers(conversationId);
    const otherTyping = typingUsers.some((t) => String(t.userId) === String(otherParticipantId));
    setIsOtherUserTyping(otherTyping);

    // Subscribe to typing changes
    const unsubscribe = socketManager.onTypingChange((convId, userId, isTyping) => {
      if (convId === conversationId && String(userId) === String(otherParticipantId)) {
        setIsOtherUserTyping(isTyping);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherParticipantId]);

  // Handle input text changes with typing indicator
  const handleTextChange = useCallback(
    (text: string, setInputText: (text: string) => void) => {
      setInputText(text);

      const channelTopic = `conversation:${conversationId}`;

      if (text.length > 0) {
        socketManager.sendTyping(channelTopic, true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socketManager.sendTyping(channelTopic, false);
        }, 5000);
      }
    },
    [conversationId]
  );

  // Stop typing indicator
  const stopTypingIndicator = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketManager.sendTyping(`conversation:${conversationId}`, false);
  }, [conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOtherUserOnline,
    isOtherUserTyping,
    otherParticipantLastSeen,
    setOtherParticipantLastSeen,
    handleTextChange,
    stopTypingIndicator,
  };
}

export default usePresence;
