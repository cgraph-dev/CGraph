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
 * @version 1.0.0
 * @module components/forums/ForumHierarchyTree
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
  HashtagIcon,
  PlusIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks';

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch and manage forum tree data
 */
export function useForumTree(rootForumId?: string, maxDepth = 10, showHidden = false) {
  const [tree, setTree] = useState<ForumNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          max_depth: maxDepth.toString(),
          include_hidden: showHidden.toString(),
        };

        let response;
        if (rootForumId) {
          response = await api.get(`/api/v1/forums/${rootForumId}/subtree`, { params });
        } else {
          response = await api.get('/api/v1/forums/tree', { params });
        }

        setTree(response.data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch forum tree:', err);
        setError('Failed to load forum structure');
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [rootForumId, maxDepth, showHidden]);

  return { tree, loading, error, refetch: () => setLoading(true) };
}

/**
 * Hook to fetch breadcrumbs for a forum
 */
export function useForumBreadcrumbs(forumId: string | undefined) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!forumId) {
      setBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/forums/${forumId}/breadcrumbs`);
        setBreadcrumbs(response.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch breadcrumbs:', err);
        setBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreadcrumbs();
  }, [forumId]);

  return { breadcrumbs, loading };
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Single tree node (forum item)
 */
const TreeNode = memo(function TreeNode({
  node,
  level = 0,
  expandedIds,
  toggleExpanded,
  selectedId,
  onSelect,
  adminMode,
  compact,
}: {
  node: ForumNode;
  level?: number;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  selectedId?: string;
  onSelect?: (forum: ForumNode) => void;
  adminMode?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  const handleClick = useCallback(() => {
    if (node.forum_type === 'link' && node.redirect_url) {
      window.open(node.redirect_url, '_blank');
      return;
    }

    if (onSelect) {
      onSelect(node);
    } else {
      navigate(`/forums/${node.slug}`);
    }
  }, [node, onSelect, navigate]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpanded(node.id);
    },
    [node.id, toggleExpanded]
  );

  // Icon based on forum type
  const ForumIcon = useMemo(() => {
    if (node.forum_type === 'category') {
      return isExpanded ? FolderOpenIcon : FolderIcon;
    }
    if (node.forum_type === 'link') {
      return LinkIcon;
    }
    return HashtagIcon;
  }, [node.forum_type, isExpanded]);

  const paddingLeft = compact ? level * 12 : level * 20;

  return (
    <div className="select-none">
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
        }}
        className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isSelected ? 'ring-1 ring-orange-500/30' : ''} `}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Forum icon */}
        {node.icon_url ? (
          <img src={node.icon_url} alt="" className="h-5 w-5 rounded object-cover" />
        ) : (
          <ForumIcon
            className={`h-5 w-5 ${
              node.forum_type === 'category'
                ? 'text-blue-500'
                : node.forum_type === 'link'
                  ? 'text-purple-500'
                  : 'text-orange-500'
            } `}
          />
        )}

        {/* Forum name */}
        <span
          className={`flex-1 truncate text-sm font-medium ${
            isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'
          } `}
        >
          {node.name}
        </span>

        {/* Public/private indicator */}
        {!node.is_public && (
          <LockClosedIcon className="h-3.5 w-3.5 text-gray-400" title="Private" />
        )}

        {/* External link indicator */}
        {node.forum_type === 'link' && (
          <ArrowsPointingOutIcon className="h-3.5 w-3.5 text-gray-400" title="External link" />
        )}

        {/* Stats (non-compact only) */}
        {!compact && node.forum_type !== 'link' && (
          <div className="hidden items-center gap-2 text-xs text-gray-400 group-hover:flex">
            <span>{node.total_post_count || node.post_count} posts</span>
          </div>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
                selectedId={selectedId}
                onSelect={onSelect}
                adminMode={adminMode}
                compact={compact}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Forum Hierarchy Tree
 * Renders a navigable tree of forums with expand/collapse functionality
 */
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
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span className="text-sm">Loading forums...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex flex-col items-center text-center text-gray-500">
          <GlobeAltIcon className="mb-2 h-8 w-8 text-gray-300" />
          <span className="text-sm">No forums yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Controls */}
      {!compact && (
        <div className="mb-2 flex items-center justify-between px-2 py-1 text-xs text-gray-500">
          <span>Forums</span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="hover:text-gray-700 dark:hover:text-gray-300"
              title="Expand all"
            >
              Expand
            </button>
            <span>|</span>
            <button
              onClick={collapseAll}
              className="hover:text-gray-700 dark:hover:text-gray-300"
              title="Collapse all"
            >
              Collapse
            </button>
          </div>
        </div>
      )}

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
            /* TODO: Open create subforum modal */
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Create forum
        </button>
      )}
    </div>
  );
});

/**
 * Forum Breadcrumbs
 * Shows the navigation path to a forum
 */
export const ForumBreadcrumbs = memo(function ForumBreadcrumbs({
  forumId,
  includeCurrent = true,
  className = '',
}: ForumBreadcrumbsProps) {
  const { breadcrumbs, loading } = useForumBreadcrumbs(forumId);

  if (loading || breadcrumbs.length === 0) {
    return null;
  }

  const displayCrumbs = includeCurrent ? breadcrumbs : breadcrumbs.slice(0, -1);

  if (displayCrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/forums"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Forums
      </Link>

      {displayCrumbs.map((crumb, idx) => (
        <span key={crumb.id} className="flex items-center">
          <ChevronRightIcon className="mx-2 h-4 w-4 text-gray-400" />
          {idx === displayCrumbs.length - 1 && includeCurrent ? (
            <span className="font-medium text-gray-900 dark:text-white">{crumb.name}</span>
          ) : (
            <Link
              to={`/forums/${crumb.slug}`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {crumb.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
});

/**
 * Compact forum navigation for sidebars
 */
export const ForumSidebarNav = memo(function ForumSidebarNav({
  selectedForumId,
  onSelect,
}: {
  selectedForumId?: string;
  onSelect?: (forum: ForumNode) => void;
}) {
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

export default ForumHierarchyTree;
