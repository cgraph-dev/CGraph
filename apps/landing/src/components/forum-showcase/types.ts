/**
 * ForumShowcase - Type Definitions
 */

export interface ForumBoard {
  id: string;
  name: string;
  icon: string;
  description: string;
  threads: number;
  posts: number;
  color: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  icon: string;
  boards: ForumBoard[];
  collapsed: boolean;
}

export interface DraggableBoardProps {
  board: ForumBoard;
  isDragging: boolean;
}

export interface CategoryProps {
  category: ForumCategory;
  onToggle: () => void;
  onReorderBoards: (boards: ForumBoard[]) => void;
  draggingBoardId: string | null;
}

export interface ThreadPrefix {
  name: string;
  color: string;
  bg: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface SampleThread {
  prefix: string;
  title: string;
  replies: number;
  views: number;
}

export interface ModerationAction {
  icon: string;
  title: string;
  desc: string;
}

export interface QueueItem {
  type: string;
  item: string;
}

export interface TabItem {
  id: 'organize' | 'threads' | 'moderation';
  label: string;
  icon: string;
}

export type ActiveTab = 'organize' | 'threads' | 'moderation';
