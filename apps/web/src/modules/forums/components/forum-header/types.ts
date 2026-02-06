/**
 * Forum Header Types
 *
 * Type definitions for the forum header module
 */

import type { Forum } from '@/stores/forumStore';

export type { Forum };

/**
 * Props for the ForumHeader component
 */
export interface ForumHeaderProps {
  forum: Forum;
  onVote?: (value: 1 | -1 | null) => Promise<void>;
  onSubscribe?: () => Promise<void>;
  onJoin?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  onShare?: () => void;
  onSettings?: () => void;
  onEditBanner?: () => void;
  onEditIcon?: () => void;
  onCreatePost?: () => void;
  isSubscribed?: boolean;
  isMember?: boolean;
  canManage?: boolean;
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

/**
 * Props for the VoteButtons sub-component
 */
export interface VoteButtonsProps {
  userVote: 0 | 1 | -1 | null | undefined;
  score: number;
  onVote: (value: 1 | -1) => void;
  isVoting: boolean;
}

/**
 * Props for the ForumStats sub-component
 */
export interface ForumStatsProps {
  memberCount: number;
  featured?: boolean;
}

/**
 * Props for the ForumActions sub-component
 */
export interface ForumActionsProps {
  primaryColor: string;
  isMember: boolean;
  isSubscribed: boolean;
  canManage: boolean;
  isJoining: boolean;
  isSubscribing: boolean;
  showMoreMenu: boolean;
  onCreatePost?: () => void;
  onJoin: () => void;
  onSubscribe: () => void;
  onSettings?: () => void;
  onCopyLink: () => void;
  onToggleMenu: () => void;
}

/**
 * Props for the ForumIcon sub-component
 */
export interface ForumIconProps {
  iconUrl?: string | null;
  name: string;
  primaryColor: string;
  size?: 'sm' | 'md' | 'lg';
  canManage?: boolean;
  onEditIcon?: () => void;
}
