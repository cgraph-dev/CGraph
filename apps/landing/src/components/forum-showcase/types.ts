import type { ForumIconVariant } from './ForumNeonIcon';

export interface ForumBoard {
  id: string;
  name: string;
  icon: ForumIconVariant;
  description: string;
  threads: number;
  posts: number;
  color: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  icon: ForumIconVariant;
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
  icon: ForumIconVariant;
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
  icon: ForumIconVariant;
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
  icon: ForumIconVariant;
}

export type ActiveTab = 'organize' | 'threads' | 'moderation';
