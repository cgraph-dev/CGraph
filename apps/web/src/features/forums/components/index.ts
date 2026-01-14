/**
 * Forum Components
 * 
 * Re-exports forum-related components from the legacy structure
 * for backward compatibility while enabling feature-based imports.
 */

// Forum UI components - available
export { default as PollWidget } from '@/components/forums/PollWidget';
export { default as AttachmentUploader } from '@/components/forums/AttachmentUploader';
export { default as EditHistoryModal } from '@/components/forums/EditHistoryModal';
export { default as UserSignature } from '@/components/forums/UserSignature';
export { default as ReportModal } from '@/components/forums/ReportModal';

// Thread components
export { default as ThreadPrefixComponent } from '@/components/forums/ThreadPrefix';
export { default as ThreadRating } from '@/components/forums/ThreadRating';

// Other forum components
export { default as ForumStatistics } from '@/components/forums/ForumStatistics';
export { default as LeaderboardWidget } from '@/components/forums/LeaderboardWidget';
export { default as MultiQuoteIndicator } from '@/components/forums/MultiQuoteIndicator';
export { default as NestedComments } from '@/components/forums/NestedComments';
export { default as QuickReply } from '@/components/forums/QuickReply';

// TODO: Create these components when needed
// export { default as ThreadPrefixBadge } from '@/components/forums/ThreadPrefixBadge';
// export { default as PostRating } from '@/components/forums/PostRating';
// export { default as ThreadRatingDisplay } from '@/components/forums/ThreadRatingDisplay';
// export { default as MultiQuotePanel } from '@/components/forums/MultiQuotePanel';
// export { default as ModeratorActions } from '@/components/forums/ModeratorActions';
// export { default as SimilarThreads } from '@/components/forums/SimilarThreads';
// export { default as QuoteBlock } from '@/components/forums/QuoteBlock';

// Common components used in forums
export { default as UserStars } from '@/components/common/UserStars';
export { default as RSSFeedLinks } from '@/components/common/RSSFeedLinks';
export { default as OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';

// Subscription components
export { SubscriptionButton } from '@/components/forum/SubscriptionButton';
export { SubscriptionManager } from '@/components/forum/SubscriptionManager';
