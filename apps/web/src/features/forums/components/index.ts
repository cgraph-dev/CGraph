/**
 * Forum Components
 *
 * Re-exports forum-related components from the module structure.
 * This file maintains backward compatibility for existing imports.
 *
 * @deprecated Import from '@/modules/forums/components' instead
 */

// Re-export everything from the modules location
export {
  PollWidget,
  AttachmentUploader,
  EditHistoryModal,
  UserSignature,
  ReportModal,
  ThreadPrefix as ThreadPrefixComponent,
  ThreadRating,
  ForumStatistics,
  LeaderboardWidget,
  MultiQuoteIndicator,
  NestedComments,
  QuickReply,
  // Additional exports from modules
  ThreadView,
  ThreadedCommentTree,
  ForumSearch,
  ForumCategoryList,
  ForumHeader,
  PostEditor,
  PostIconPicker,
  PostIconDisplay,
  RSSFeedButton,
  RSSFeedLink,
  FeedSubscribeModal,
} from '@/modules/forums/components';

// Re-export types
export type {
  SearchFilters,
  PostEditorData,
  PostIcon,
  PostIconPickerProps,
  RSSFeedButtonProps,
  FeedType,
  FeedFormat,
} from '@/modules/forums/components';

// Common components used in forums (still from common)
export { default as UserStars } from '@/components/common/UserStars';
export { default as RSSFeedLinks } from '@/components/common/RSSFeedLinks';
export { default as OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';

// Subscription components - these remain in old location until migrated
export { SubscriptionButton } from '@/modules/forums/components/SubscriptionButton';
export { SubscriptionManager } from '@/modules/forums/components/SubscriptionManager';
