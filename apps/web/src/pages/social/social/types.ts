/**
 * Social Hub - Type Definitions
 */

import type { Friend, FriendRequest } from '@/modules/social/store';

// =============================================================================
// TAB TYPES
// =============================================================================

export type SocialTab = 'friends' | 'notifications' | 'discover';

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | 'friend_request'
  | 'message'
  | 'forum_reply'
  | 'achievement'
  | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatarUrl?: string;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export type SearchResultType = 'user' | 'forum' | 'group';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  description: string;
  avatarUrl?: string;
  memberCount?: number;
  isJoined?: boolean;
}

// =============================================================================
// TAB PROPS
// =============================================================================

export interface FriendsTabProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface NotificationsTabProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export interface DiscoverTabProps {
  searchQuery: string;
  searchResults: SearchResult[];
  onSearchChange: (query: string) => void;
}
