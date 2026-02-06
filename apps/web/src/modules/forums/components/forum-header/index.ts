/**
 * Forum Header Module
 *
 * Forum header components with banner and key information
 */

// Main component
export { ForumHeader, default } from './ForumHeader';

// Sub-components
export { VoteButtons } from './VoteButtons';
export { ForumStats } from './ForumStats';
export { ForumActions } from './ForumActions';
export { ForumIcon } from './ForumIcon';
export { ForumHeaderCompact } from './ForumHeaderCompact';
export { ForumHeaderHero } from './ForumHeaderHero';

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
