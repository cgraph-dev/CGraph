import type { Board, Thread, ForumMember, Forum } from '../../../stores/forumHostingStore';

/**
 * Props for the main ForumBoardView component
 */
export interface ForumBoardViewProps {
  className?: string;
}

/**
 * Active tab state for the forum view
 */
export type ForumTab = 'boards' | 'threads' | 'members';

/**
 * Sort options for members list
 */
export type MemberSortOption = 'recent' | 'reputation' | 'posts' | 'alphabetical';

/**
 * Props for the BoardsList component
 */
export interface BoardsListProps {
  boards: Board[];
  forumSlug: string;
  isLoading: boolean;
  isOwner: boolean;
}

/**
 * Props for an individual board row
 */
export interface BoardRowProps {
  board: Board;
  forumSlug: string;
}

/**
 * Props for the ThreadsList component
 */
export interface ThreadsListProps {
  threads: Thread[];
  forumSlug: string;
  isLoading: boolean;
}

/**
 * Props for an individual thread row
 */
export interface ThreadRowProps {
  thread: Thread;
  forumSlug: string;
}

/**
 * Props for the MembersList component
 */
export interface MembersListProps {
  members: ForumMember[];
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  sort: MemberSortOption;
  onSortChange: (sort: MemberSortOption) => void;
}

/**
 * Props for an individual member card
 */
export interface MemberCardProps {
  member: ForumMember;
}

/**
 * Props for the ForumHeader component
 */
export interface ForumHeaderProps {
  forum: Forum;
  user: { id: string } | null;
  isOwner: boolean;
  onVote: (type: 'up' | 'down') => void;
  onSubscribe: () => void;
  isSubscribed: boolean;
  activeTab: ForumTab;
  onTabChange: (tab: ForumTab) => void;
}

// Re-export store types for convenience
export type { Board, Thread, ForumMember, Forum };
