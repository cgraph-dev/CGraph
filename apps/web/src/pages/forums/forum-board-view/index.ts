/**
 * ForumBoardView Module
 *
 * MyBB-style forum board and thread listing with:
 * - Forum header with banner, icon, stats, voting
 * - Boards list with thread/post counts
 * - Threads list with reply/view counts
 * - Members directory with search and sort
 */

export { ForumBoardView } from './forum-board-view';
export { ForumBoardBanner } from './forum-board-banner';
export { BoardsList } from './boards-list';
export { BoardRow } from './board-row';
export { ThreadsList } from './threads-list';
export { ThreadRow } from './thread-row';
export { MembersList } from './members-list';
export { MemberCard } from './member-card';
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
export { ForumBoardView as default } from './forum-board-view';
