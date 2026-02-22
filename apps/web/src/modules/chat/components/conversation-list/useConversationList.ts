/**
 * useConversationList hook
 * @module modules/chat/components/conversation-list
 */

import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore, type Conversation } from '@/modules/chat/store';
import { useAuthStore } from '@/modules/auth/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { FilterType, UseConversationListReturn } from './types';
import { getConversationName } from './utils';

export function useConversationList(): UseConversationListReturn {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showNewChat, setShowNewChat] = useState(false);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (conv) =>
          getConversationName(conv, user?.id).toLowerCase().includes(query) ||
          conv.lastMessage?.content.toLowerCase().includes(query)
      );
    }

    // Apply filter
    switch (filter) {
      case 'direct':
        result = result.filter((conv) => !conv.isGroup);
        break;
      case 'group':
        result = result.filter((conv) => conv.isGroup);
        break;
      case 'unread':
        result = result.filter((conv) => conv.unreadCount > 0);
        break;
    }

    // Sort: pinned first, then by last message
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return result;
  }, [conversations, searchQuery, filter, user?.id]);

  // Group by pinned
  const { pinnedConversations, regularConversations } = useMemo(() => {
    return {
      pinnedConversations: filteredConversations.filter((c) => c.isPinned),
      regularConversations: filteredConversations.filter((c) => !c.isPinned),
    };
  }, [filteredConversations]);

  const handleConversationClick = useCallback(
    (conv: Conversation) => {
      HapticFeedback.light();
      navigate(`/messages/${conv.id}`);
    },
    [navigate]
  );

  return {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    showNewChat,
    setShowNewChat,
    pinnedConversations,
    regularConversations,
    filteredConversations,
    handleConversationClick,
  };
}
