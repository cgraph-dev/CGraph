/**
 * ForumHierarchyTree type definitions
 * @module modules/forums/components/forum-hierarchy-tree
 */

export interface ForumNode {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  icon_url?: string;
  is_public: boolean;
  forum_type: 'category' | 'forum' | 'link';
  redirect_url?: string;
  depth: number;
  display_order: number;
  collapsed_by_default: boolean;
  member_count: number;
  post_count: number;
  thread_count: number;
  total_member_count: number;
  total_post_count: number;
  total_thread_count: number;
  children?: ForumNode[];
}

export interface Breadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface ForumHierarchyTreeProps {
  /** Root forum ID to start tree from (null for full tree) */
  rootForumId?: string;
  /** Maximum depth to display */
  maxDepth?: number;
  /** Whether to show hidden forums */
  showHidden?: boolean;
  /** Selected forum ID */
  selectedForumId?: string;
  /** Callback when forum is selected */
  onSelect?: (forum: ForumNode) => void;
  /** Whether admin features are enabled */
  adminMode?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode for sidebars */
  compact?: boolean;
}

export interface ForumBreadcrumbsProps {
  /** Forum ID to show breadcrumbs for */
  forumId: string;
  /** Whether to include current forum */
  includeCurrent?: boolean;
  /** Custom class name */
  className?: string;
}

export interface TreeNodeProps {
  node: ForumNode;
  level?: number;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  selectedId?: string;
  onSelect?: (forum: ForumNode) => void;
  adminMode?: boolean;
  compact?: boolean;
}

export interface ForumSidebarNavProps {
  selectedForumId?: string;
  onSelect?: (forum: ForumNode) => void;
}
