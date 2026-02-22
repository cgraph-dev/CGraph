/**
 * usePinnedMessages Hook
 *
 * Manages pinned message state and navigation for conversations.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Message } from '../../../../types';

interface UsePinnedMessagesOptions {
  messages: Message[];
  flatListRef: React.RefObject<FlatList>;
}

interface UsePinnedMessagesReturn {
  pinnedMessages: Message[];
  currentPinnedIndex: number;
  currentPinnedMessage: Message | null;
  setCurrentPinnedIndex: React.Dispatch<React.SetStateAction<number>>;
  scrollToMessage: (messageId: string) => void;
  navigatePinnedMessages: (direction: 'next' | 'prev') => void;
}

/**
 * Hook for managing pinned messages in a conversation.
 */
export function usePinnedMessages({
  messages,
  flatListRef,
}: UsePinnedMessagesOptions): UsePinnedMessagesReturn {
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);

  // Get all pinned messages, sorted by pin date (most recent first)
  const pinnedMessages = useMemo(() => {
    return messages
      .filter((m) => m.is_pinned)
      .sort((a, b) => {
        const aDate = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const bDate = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        return bDate - aDate;
      });
  }, [messages]);

  // Reset pinned index when pinned messages change
  useEffect(() => {
    if (pinnedMessages.length === 0) {
      setCurrentPinnedIndex(0);
    } else if (currentPinnedIndex >= pinnedMessages.length) {
      setCurrentPinnedIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, currentPinnedIndex]);

  // Get the current pinned message to display
  const currentPinnedMessage = useMemo(() => {
    return pinnedMessages.length > 0
      ? pinnedMessages[Math.min(currentPinnedIndex, pinnedMessages.length - 1)]
      : null;
  }, [pinnedMessages, currentPinnedIndex]);

  // Scroll to a specific message by ID
  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((m) => m.id === messageId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.3,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [messages, flatListRef]
  );

  // Navigate to next/prev pinned message
  const navigatePinnedMessages = useCallback(
    (direction: 'next' | 'prev') => {
      if (pinnedMessages.length <= 1) return;

      if (direction === 'next') {
        setCurrentPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
      } else {
        setCurrentPinnedIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
      }
      Haptics.selectionAsync();
    },
    [pinnedMessages.length]
  );

  return {
    pinnedMessages,
    currentPinnedIndex,
    currentPinnedMessage,
    setCurrentPinnedIndex,
    scrollToMessage,
    navigatePinnedMessages,
  };
}

export default usePinnedMessages;
