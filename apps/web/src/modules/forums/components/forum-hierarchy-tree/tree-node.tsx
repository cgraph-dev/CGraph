/**
 * TreeNode component
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  LinkIcon,
  HashtagIcon,
  LockClosedIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import type { TreeNodeProps } from './types';
import { tweens } from '@/lib/animation-presets';

export const TreeNode = memo(function TreeNode({
  node,
  level = 0,
  expandedIds,
  toggleExpanded,
  selectedId,
  onSelect,
  adminMode,
  compact,
}: TreeNodeProps) {
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
        className={`dark:hover:bg-white/[0.06]/50 group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 ${isSelected ? 'ring-1 ring-orange-500/30' : ''} `}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-white/[0.10]"
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
            transition={tweens.fast}
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
