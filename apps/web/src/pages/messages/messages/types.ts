/**
 * Messages Types
 *
 * Type definitions for the messages page components.
 */

import type { Conversation } from '@/modules/chat/store';

/**
 * Online status map by conversation-user key
 */
export type OnlineStatusMap = Record<string, boolean>;

/**
 * ConversationItem component props
 */
export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onlineStatus: OnlineStatusMap;
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  searchQuery: string;
}

/**
 * Conversation sidebar props
 */
export interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  onlineStatus: OnlineStatusMap;
  searchQuery: string;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onOpenSearch: () => void;
  onNewConversation: () => void;
}

// Re-export store types for convenience
export type { Conversation } from '@/modules/chat/store';
