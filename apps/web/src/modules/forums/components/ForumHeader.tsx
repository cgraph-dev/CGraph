/**
 * Forum Header - Re-export from modularized module
 *
 * @module forums/components/ForumHeader
 * @see ./forum-header for implementation
 */

export {
  ForumHeader,
  default,
  VoteButtons,
  ForumStats,
  ForumActions,
  ForumIcon,
  ForumHeaderCompact,
  ForumHeaderHero,
  formatNumber,
} from './forum-header';

export type {
  ForumHeaderProps,
  VoteButtonsProps,
  ForumStatsProps,
  ForumActionsProps,
  ForumIconProps,
  Forum,
} from './forum-header';
