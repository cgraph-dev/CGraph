/**
 * Shared Feedback Components
 *
 * Re-exports feedback components (Toast, Alert, Loading states).
 * Import from '@/shared/components/feedback' for the new architecture.
 *
 * @module @shared/components/feedback
 */

// Toast and notifications
export { ToastContainer, toast, useToastStore } from '@/components/ui/toast';

// Alert components
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Error and empty states
export {
  ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  EmptyState,
  NoPostsEmpty,
  NoCommentsEmpty,
  NoMembersEmpty,
  NoMessagesEmpty,
  NoFriendsEmpty,
  SearchNoResults,
} from '@/components/ui';

// Loading states
export { Skeleton, PostCardSkeleton, ForumCardSkeleton, CommentSkeleton } from '@/components/ui';
