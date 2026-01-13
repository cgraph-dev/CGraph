/**
 * Forum Components
 * 
 * Re-exports forum-related components from the legacy structure
 * for backward compatibility while enabling feature-based imports.
 */

// Forum UI components
export { default as ThreadPrefixBadge } from '@/components/forums/ThreadPrefixBadge';
export { default as PollWidget } from '@/components/forums/PollWidget';
export { default as AttachmentUploader } from '@/components/forums/AttachmentUploader';
export { default as PostRating } from '@/components/forums/PostRating';
export { default as EditHistoryModal } from '@/components/forums/EditHistoryModal';
export { default as ThreadRatingDisplay } from '@/components/forums/ThreadRatingDisplay';
export { default as UserSignature } from '@/components/forums/UserSignature';
export { default as MultiQuotePanel } from '@/components/forums/MultiQuotePanel';
export { default as ReportModal } from '@/components/forums/ReportModal';
export { default as ModeratorActions } from '@/components/forums/ModeratorActions';
export { default as SimilarThreads } from '@/components/forums/SimilarThreads';
export { default as QuoteBlock } from '@/components/forums/QuoteBlock';

// Common components used in forums
export { default as UserStars } from '@/components/common/UserStars';
export { default as RSSFeedLinks } from '@/components/common/RSSFeedLinks';

// Subscription components
export { SubscriptionButton } from '@/components/forum/SubscriptionButton';
export { SubscriptionManager } from '@/components/forum/SubscriptionManager';
