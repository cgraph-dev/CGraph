/**
 * ThreadView Types
 * @module modules/forums/components/thread-view/types
 */

import type { Post, Comment, ThreadPrefix } from '@/stores/forumStore';

/**
 * View modes for comment display
 */
export type CommentViewMode = 'linear' | 'threaded';

/**
 * Props for the ThreadView component
 */
export interface ThreadViewProps {
  post: Post;
  comments: Comment[];
  isLoading?: boolean;
  onVote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
  onComment: (content: string, parentId?: string) => Promise<void>;
  onBookmark?: () => Promise<void>;
  onShare?: () => void;
  onSubscribe?: () => Promise<void>;
  onRate?: (rating: number) => Promise<void>;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  onReport?: () => void;
  onExport?: () => void;
  onMarkBestAnswer?: (commentId: string) => void;
  isBookmarked?: boolean;
  isSubscribed?: boolean;
  canModerate?: boolean;
  canEdit?: boolean;
  canMarkBestAnswer?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
  /** Initial view mode - persisted to localStorage */
  defaultViewMode?: CommentViewMode;
}

/**
 * Props for thread prefix badge
 */
export interface ThreadPrefixBadgeProps {
  prefix: ThreadPrefix;
}

/**
 * Props for rating stars component
 */
export interface RatingStarsProps {
  rating?: number;
  myRating?: number;
  ratingCount?: number;
  primaryColor: string;
  hoveredRating: number;
  setHoveredRating: (rating: number) => void;
  onRate: (rating: number) => void;
}

/**
 * Props for comment card component
 */
export interface CommentCardProps {
  comment: Comment;
  index: number;
  onVote: (commentId: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
}

/**
 * Props for share menu
 */
export interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
}

/**
 * Props for more options menu
 */
export interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  canEdit: boolean;
  canModerate: boolean;
  onEdit?: () => void;
  onPin?: () => Promise<void>;
  onLock?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
}

/**
 * Props for comment form
 */
export interface CommentFormProps {
  isOpen: boolean;
  content: string;
  setContent: (content: string) => void;
  isSubmitting: boolean;
  primaryColor: string;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Props for view mode toggle
 */
export interface ViewModeToggleProps {
  viewMode: CommentViewMode;
  onViewModeChange: (mode: CommentViewMode) => void;
}

/**
 * Internal hook state for ThreadView
 */
export interface ThreadViewState {
  isExpanded: boolean;
  showCommentForm: boolean;
  commentContent: string;
  isSubmitting: boolean;
  hoveredRating: number;
  showShareMenu: boolean;
  showMoreMenu: boolean;
  replyToId: string | undefined;
  viewMode: CommentViewMode;
}
