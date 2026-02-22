/**
 * Forum Header Module
 *
 * Forum header components with banner and key information
 */

// Main component
export { ForumHeader, default } from './forum-header';

// Sub-components
export { VoteButtons } from './vote-buttons';
export { ForumStats } from './forum-stats';
export { ForumActions } from './forum-actions';
export { ForumIcon } from './forum-icon';
export { ForumHeaderCompact } from './forum-header-compact';
export { ForumHeaderHero } from './forum-header-hero';

// Types
export type {
  ForumHeaderProps,
  VoteButtonsProps,
  ForumStatsProps,
  ForumActionsProps,
  ForumIconProps,
  Forum,
} from './types';

// Utils
export { formatNumber, copyCurrentUrl } from './utils';
