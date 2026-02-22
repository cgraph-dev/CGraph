/**
 * ForumSidebarNav component
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { memo } from 'react';
import type { ForumSidebarNavProps } from './types';
import { ForumHierarchyTree } from './forum-hierarchy-tree';

export const ForumSidebarNav = memo(function ForumSidebarNav({
  selectedForumId,
  onSelect,
}: ForumSidebarNavProps) {
  return (
    <ForumHierarchyTree
      selectedForumId={selectedForumId}
      onSelect={onSelect}
      compact
      maxDepth={5}
      className="py-2"
    />
  );
});
