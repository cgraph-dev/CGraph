/**
 * Type definitions for Forums page
 * @module pages/forums/forums/types
 */

import type { Post } from '@/stores/forumStore';

/**
 * Sort option configuration
 */
export interface SortOption {
  value: 'hot' | 'new' | 'top';
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Time range option configuration
 */
export interface TimeRangeOption {
  value: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  label: string;
}

/**
 * Props for PostCard component
 */
export interface PostCardProps {
  post: Post;
  onVote: (value: 1 | -1) => void;
}

/**
 * Props for ForumHeader component
 */
export interface ForumHeaderProps {
  forum: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    bannerUrl?: string;
    memberCount?: number;
    isSubscribed: boolean;
    ownerId?: string;
    moderators?: Array<{ id: string }>;
    createdAt: string;
  };
  userId?: string;
  onSubscribe: () => void;
  onNavigateToAdmin: () => void;
}

/**
 * Props for SortControls component
 */
export interface SortControlsProps {
  sortBy: 'hot' | 'new' | 'top';
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  showSortMenu: boolean;
  showTimeMenu: boolean;
  isAuthenticated: boolean;
  onSortChange: (value: 'hot' | 'new' | 'top') => void;
  onTimeRangeChange: (value: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all') => void;
  onToggleSortMenu: () => void;
  onToggleTimeMenu: () => void;
  onCloseSortMenu: () => void;
  onCloseTimeMenu: () => void;
  onNavigateToCreateForum: () => void;
}

/**
 * Props for ForumSidebar component
 */
export interface ForumSidebarProps {
  activeForum: {
    id: string;
    slug: string;
    description?: string;
    memberCount?: number;
    createdAt: string;
  } | null;
  forums: Array<{
    id: string;
    name: string;
    slug: string;
    iconUrl?: string;
    memberCount?: number;
    isPublic: boolean;
  }>;
  isLoadingForums: boolean;
}

/**
 * Props for PostsList component
 */
export interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  activeForum: { slug: string } | null;
  onVote: (postId: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  onLoadMore: () => void;
}
