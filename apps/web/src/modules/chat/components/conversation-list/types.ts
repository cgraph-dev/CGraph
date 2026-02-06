/**
 * ConversationList type definitions
 * @module modules/chat/components/conversation-list
 */

import type { Conversation } from '@/stores/chatStore';

export type FilterType = 'all' | 'direct' | 'group' | 'unread';

export interface ConversationListProps {
  className?: string;
}

export interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: string;
  typingUsers: string[];
  onClick: () => void;
}

export interface ConversationMenuProps {
  conversation: Conversation;
  onAction: (action: 'pin' | 'mute' | 'archive' | 'delete') => void;
}

export interface NewChatModalProps {
  onClose: () => void;
}

export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: 'online' | 'offline';
}

export interface FilterOption {
  id: FilterType;
  label: string;
}

export interface UseConversationListReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  pinnedConversations: Conversation[];
  regularConversations: Conversation[];
  filteredConversations: Conversation[];
  handleConversationClick: (conv: Conversation) => void;
}
