/**
 * Channel Messages & Typing Hooks
 *
 * Custom React hooks for channel messages and typing indicators.
 *
 * @module modules/groups/hooks/useChannelMessages
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useGroupStore } from '../store';
import type { ChannelMessage } from '../store';

/**
 * Hook for channel messages
 */
export function useChannelMessages(channelId?: string) {
  const {
    channelMessages,
    isLoadingMessages,
    hasMoreMessages,
    typingUsers,
    fetchChannelMessages,
    sendChannelMessage,
    addChannelMessage,
    updateChannelMessage,
    removeChannelMessage,
  } = useGroupStore();

  const messages = useMemo(
    () => (channelId ? (channelMessages[channelId] ?? []) : []),
    [channelMessages, channelId]
  );

  const hasMore = useMemo(
    () => (channelId ? (hasMoreMessages[channelId] ?? true) : false),
    [hasMoreMessages, channelId]
  );

  const typing = useMemo(
    () => (channelId ? (typingUsers[channelId] ?? []) : []),
    [typingUsers, channelId]
  );

  // Fetch initial messages
  useEffect(() => {
    if (channelId && messages.length === 0) {
      fetchChannelMessages(channelId);
    }
  }, [channelId, messages.length, fetchChannelMessages]);

  const loadMore = useCallback(async () => {
    if (channelId && hasMore && messages.length > 0) {
      const oldestMessage = messages[messages.length - 1];
      if (oldestMessage) {
        await fetchChannelMessages(channelId, oldestMessage.id);
      }
    }
  }, [channelId, hasMore, messages, fetchChannelMessages]);

  const send = useCallback(
    async (content: string, replyToId?: string) => {
      if (channelId) {
        await sendChannelMessage(channelId, content, replyToId);
      }
    },
    [channelId, sendChannelMessage]
  );

  const addMessage = useCallback(
    (message: ChannelMessage) => {
      addChannelMessage(message);
    },
    [addChannelMessage]
  );

  const updateMessage = useCallback(
    (message: ChannelMessage) => {
      updateChannelMessage(message);
    },
    [updateChannelMessage]
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      if (channelId) {
        removeChannelMessage(messageId, channelId);
      }
    },
    [channelId, removeChannelMessage]
  );

  return {
    messages,
    isLoading: isLoadingMessages,
    hasMore,
    typingUsers: typing,
    loadMore,
    send,
    addMessage,
    updateMessage,
    removeMessage,
  };
}

/**
 * Hook for group typing indicators
 */
export function useGroupTyping(channelId?: string) {
  const { typingUsers, setTypingUser } = useGroupStore();

  const typing = useMemo(
    () => (channelId ? (typingUsers[channelId] ?? []) : []),
    [typingUsers, channelId]
  );

  const setTyping = useCallback(
    (userId: string, isTyping: boolean) => {
      if (channelId) {
        setTypingUser(channelId, userId, isTyping);
      }
    },
    [channelId, setTypingUser]
  );

  return {
    typingUsers: typing,
    isTyping: typing.length > 0,
    setTyping,
  };
}
