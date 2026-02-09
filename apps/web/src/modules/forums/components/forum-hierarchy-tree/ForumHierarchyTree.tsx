/**
 * Forum Hierarchy Tree Component
 *
 * Renders a navigable tree structure of forums with:
 * - Expandable/collapsible sub-forums
 * - Breadcrumb navigation
 * - Drag-and-drop reordering (admin only)
 * - Infinite nesting support
 * - Virtualization for large trees
 *
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/modules/auth/hooks';
import type { ForumHierarchyTreeProps, ForumNode } from './types';
import { useForumTree } from './useForumTree';
import { TreeNode } from './TreeNode';
import { TreeControls } from './TreeControls';
import { LoadingState, ErrorState, EmptyState } from './States';
import { api } from '@/lib/api';

export const ForumHierarchyTree = memo(function ForumHierarchyTree({
  rootForumId,
  maxDepth = 10,
  showHidden = false,
  selectedForumId,
  onSelect,
  adminMode = false,
  className = '',
  compact = false,
}: ForumHierarchyTreeProps) {
  const { user } = useAuth();
  const { tree, loading, error } = useForumTree(rootForumId, maxDepth, showHidden);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-expand parent nodes when selected forum changes
  useEffect(() => {
    if (selectedForumId && tree.length > 0) {
      // Find path to selected forum and expand all parents
      const findPath = (
        nodes: ForumNode[],
        targetId: string,
        path: string[] = []
      ): string[] | null => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return path;
          }
          if (node.children && node.children.length > 0) {
            const result = findPath(node.children, targetId, [...path, node.id]);
            if (result) return result;
          }
        }
        return null;
      };

      const path = findPath(tree, selectedForumId);
      if (path) {
        setExpandedIds((prev) => new Set([...prev, ...path]));
      }
    }
  }, [selectedForumId, tree]);

  // Initialize with default collapsed state
  useEffect(() => {
    if (tree.length > 0) {
      const collapsedByDefault = new Set<string>();
      const walk = (nodes: ForumNode[]) => {
        for (const node of nodes) {
          if (!node.collapsed_by_default) {
            collapsedByDefault.add(node.id);
          }
          if (node.children) walk(node.children);
        }
      };
      walk(tree);
      setExpandedIds(collapsedByDefault);
    }
  }, [tree]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const walk = (nodes: ForumNode[]) => {
      for (const node of nodes) {
        allIds.add(node.id);
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    setExpandedIds(allIds);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  if (loading) {
    return <LoadingState className={className} />;
  }

  if (error) {
    return <ErrorState error={error} className={className} />;
  }

  if (tree.length === 0) {
    return <EmptyState className={className} />;
  }

  return (
    <div className={className}>
      {/* Controls */}
      {!compact && <TreeControls onExpandAll={expandAll} onCollapseAll={collapseAll} />}

      {/* Tree */}
      <div className="space-y-0.5">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expandedIds={expandedIds}
            toggleExpanded={toggleExpanded}
            selectedId={selectedForumId}
            onSelect={onSelect}
            adminMode={adminMode && user?.isAdmin}
            compact={compact}
          />
        ))}
      </div>

      {/* Create subforum button (admin only) */}
      {adminMode && user?.isAdmin && !compact && (
        <button
          className="mt-4 flex items-center gap-2 px-2 py-1.5 text-sm text-orange-500 hover:text-orange-600"
          onClick={() => {
            const name = window.prompt('Enter subforum name:');
            if (name?.trim() && rootForumId) {
              api.post(`/api/v1/forums/${rootForumId}/create_subforum`, {
                name: name.trim(),
              }).catch(() => {});
            }
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Create forum
        </button>
      )}
    </div>
  );
});

export default ForumHierarchyTree;
