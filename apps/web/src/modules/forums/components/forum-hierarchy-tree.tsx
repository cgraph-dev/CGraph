/**
 * Forum Hierarchy Tree Component - Re-export
 * @module modules/forums/components/ForumHierarchyTree
 */

export {
  ForumHierarchyTree,
  default,
  ForumBreadcrumbs,
  ForumSidebarNav,
  useForumTree,
  useForumBreadcrumbs,
} from './forum-hierarchy-tree/index';

export { ForumHierarchyAdmin } from './forum-hierarchy-tree/forum-hierarchy-admin';

export type {
  ForumNode,
  Breadcrumb,
  ForumHierarchyTreeProps,
  ForumBreadcrumbsProps,
} from './forum-hierarchy-tree/index';
