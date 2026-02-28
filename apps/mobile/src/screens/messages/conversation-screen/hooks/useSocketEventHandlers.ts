/**
 * Hook managing WebSocket event handlers for real-time conversation updates.
 * @module screens/messages/conversation-screen/hooks/useSocketEventHandlers
 */
import { useCallback, useRef, useEffect } from 'react';
import { Message } from '../../../../types';

interface UseSocketEventHandlersOptions {
  userId?: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  scrollToBottom: () => void;
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    user?: { id: string; username?: string; display_name?: string; avatar_url?: string }
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
}

interface UseSocketEventHandlersReturn {
  handleSocketNewMessage: (message: Message) => void;
  handleSocketMessageUpdated: (message: Message) => void;
  handleSocketMessageDeleted: (messageId: string) => void;
  handleSocketMessagePinned: (messageId: string, pinnedAt: string, pinnedById: string) => void;
  handleSocketMessageUnpinned: (messageId: string) => void;
  handleSocketMessageRead: (messageId: string, userId: string) => void;
  handleSocketMessageDelivered: (messageId: string) => void;
  handleSocketReactionAdded: (data: {
    messageId: string;
    emoji: string;
    userId: string;
    user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
  }) => void;
  handleSocketReactionRemoved: (data: { messageId: string; emoji: string; userId: string }) => void;
}

/**
 * Hook for handling socket event callbacks in conversations.
 * Centralizes all message-related socket event handling logic.
 */
export function useSocketEventHandlers(
  options: UseSocketEventHandlersOptions
): UseSocketEventHandlersReturn {
  const { userId, setMessages, scrollToBottom, addReactionToMessage, removeReactionFromMessage } =
    options;

  // Handle new message from socket
  const handleSocketNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [message, ...prev];
      });
      // Scroll to bottom when receiving new message
      scrollToBottom();
    },
    [setMessages, scrollToBottom]
  );

  // Handle message update from socket
  const handleSocketMessageUpdated = useCallback(
    (message: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    },
    [setMessages]
  );

  // Handle message deletion from socket
  const handleSocketMessageDeleted = useCallback(
    (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [setMessages]
  );

  // Handle message pinned from socket
  const handleSocketMessagePinned = useCallback(
    (messageId: string, pinnedAt: string, pinnedById: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_pinned: true, pinned_at: pinnedAt, pinned_by_id: pinnedById }
            : m
        )
      );
    },
    [setMessages]
  );

  // Handle message unpinned from socket
  const handleSocketMessageUnpinned = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_pinned: false, pinned_at: undefined, pinned_by_id: undefined }
            : m
        )
      );
    },
    [setMessages]
  );

  // Handle message read status from socket
  const handleSocketMessageRead = useCallback(
    (messageId: string, _userId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender_id === userId && m.id <= messageId && !m.read_at) {
            return { ...m, read_at: new Date().toISOString(), status: 'read' as const };
          }
          return m;
        })
      );
    },
    [setMessages, userId]
  );

  // Handle message delivered status from socket
  const handleSocketMessageDelivered = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId && m.sender_id === userId && m.status !== 'read') {
            return { ...m, status: 'delivered' as const, delivered_at: new Date().toISOString() };
          }
          return m;
        })
      );
    },
    [setMessages, userId]
  );

  // Handle reaction added from socket
  const handleSocketReactionAdded = useCallback(
    (data: {
      messageId: string;
      emoji: string;
      userId: string;
      user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
    }) => {
      addReactionToMessage(data.messageId, data.emoji, data.userId, data.user);
    },
    [addReactionToMessage]
  );

  // Handle reaction removed from socket
  const handleSocketReactionRemoved = useCallback(
    (data: { messageId: string; emoji: string; userId: string }) => {
      removeReactionFromMessage(data.messageId, data.emoji, data.userId);
    },
    [removeReactionFromMessage]
  );

  return {
    handleSocketNewMessage,
    handleSocketMessageUpdated,
    handleSocketMessageDeleted,
    handleSocketMessagePinned,
    handleSocketMessageUnpinned,
    handleSocketMessageRead,
    handleSocketMessageDelivered,
    handleSocketReactionAdded,
    handleSocketReactionRemoved,
  };
}

/**
 * Safety net hook: auto-clears typing state for users after 6s if no follow-up event.
 * Prevents "stuck typing" indicators when stop-typing events are lost.
 */
export function useTypingAutoClear(
  typingUsers: string[],
  onClearTyping: (userId: string) => void
) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const currentTimers = timersRef.current;

    // Set 6s auto-clear timers for each typing user
    for (const userId of typingUsers) {
      // Clear existing timer for this user
      const existing = currentTimers.get(userId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        onClearTyping(userId);
        currentTimers.delete(userId);
      }, 6000);
      currentTimers.set(userId, timer);
    }

    // Clean up timers for users no longer typing
    for (const [userId, timer] of currentTimers.entries()) {
      if (!typingUsers.includes(userId)) {
        clearTimeout(timer);
        currentTimers.delete(userId);
      }
    }

    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, [typingUsers, onClearTyping]);
}
