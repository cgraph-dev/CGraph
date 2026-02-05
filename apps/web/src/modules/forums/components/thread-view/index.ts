/**
 * Thread View Module
 *
 * Comprehensive thread viewing experience with:
 * - Original post display with full content
 * - Virtualized comment list for performance
 * - Thread prefix badges
 * - Poll integration
 * - Rating system
 * - View counter
 * - Bookmark/subscribe functionality
 * - Share options
 * - Reply quick-action
 * - Moderation actions for privileged users
 * - View mode toggle (linear/threaded)
 * - User stars/post count indicators
 * - Export/print functionality
 *
 * @module modules/forums/components/thread-view
 */

// Main component
export { ThreadView, default } from './ThreadView';

// Types
export type {
  CommentViewMode,
  ThreadViewProps,
  ThreadPrefixBadgeProps,
  RatingStarsProps,
  CommentCardProps,
  ShareMenuProps,
  MoreMenuProps,
  CommentFormProps,
  ViewModeToggleProps,
  ThreadViewState,
} from './types';

// Hooks
export {
  useViewMode,
  useSortedComments,
  useCommentVirtualizer,
  useReplyHandler,
  useVoteHandlers,
  useCommentSubmit,
  useRating,
} from './hooks';

// Sub-components
export {
  PrefixBadge,
  RatingStars,
  ShareMenu,
  MoreMenu,
  CommentForm,
  CommentCard,
  ViewModeToggle,
  ThreadLoadingSkeleton,
  EmptyCommentsState,
  ReplyIndicator,
} from './components';
