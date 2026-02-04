import { useCallback } from 'react';
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
    handleSocketReactionAdded,
    handleSocketReactionRemoved,
  };
}
