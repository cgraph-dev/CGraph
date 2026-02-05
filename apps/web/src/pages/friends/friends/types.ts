/**
 * Types for the Friends module
 */

import type { Friend, FriendRequest } from '@/stores/friendStore';

/**
 * Tab types for friends navigation
 */
export type FriendsTab = 'all' | 'online' | 'pending' | 'blocked';

/**
 * Tab definition with metadata
 */
export interface TabDefinition {
  id: FriendsTab;
  label: string;
  count: number;
}

/**
 * Props for FriendListItem component
 */
export interface FriendListItemProps {
  friend: Friend;
  statusColor: string;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

/**
 * Props for FriendRequestCard component
 */
export interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline: () => void;
}

/**
 * Props for AddFriendForm component
 */
export interface AddFriendFormProps {
  isVisible: boolean;
  addFriendInput: string;
  setAddFriendInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  addFriendError: string;
  addFriendSuccess: boolean;
}

/**
 * Props for FriendsTabBar component
 */
export interface FriendsTabBarProps {
  tabs: TabDefinition[];
  activeTab: FriendsTab;
  setActiveTab: (tab: FriendsTab) => void;
}

/**
 * Props for FriendsSearchBar component
 */
export interface FriendsSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isVisible: boolean;
}
