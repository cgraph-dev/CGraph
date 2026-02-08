/**
 * ForumBoardView Module
 *
 * MyBB-style forum board and thread listing with:
 * - Forum header with banner, icon, stats, voting
 * - Boards list with thread/post counts
 * - Threads list with reply/view counts
 * - Members directory with search and sort
 */

export { ForumBoardView } from './ForumBoardView';
export { ForumBoardBanner } from './ForumBoardBanner';
export { BoardsList } from './BoardsList';
export { BoardRow } from './BoardRow';
export { ThreadsList } from './ThreadsList';
export { ThreadRow } from './ThreadRow';
export { MembersList } from './MembersList';
export { MemberCard } from './MemberCard';
export { useForumBoardView } from './useForumBoardView';

// Types
export type {
  ForumBoardViewProps,
  ForumTab,
  MemberSortOption,
  BoardsListProps,
  BoardRowProps,
  ThreadsListProps,
  ThreadRowProps,
  MembersListProps,
  MemberCardProps,
  ForumHeaderProps,
} from './types';

// Constants
export { ROLE_COLORS, MEMBER_SORT_OPTIONS, SKELETON_COUNTS } from './constants';

// Default export for lazy loading compatibility
export { ForumBoardView as default } from './ForumBoardView';
