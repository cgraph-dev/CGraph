/**
 * Recursive admin node list with inline actions
 * @module modules/forums/components/forum-hierarchy-tree
 */

import {
  ArrowsUpDownIcon,
  FolderPlusIcon,
  ArrowUturnUpIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumNode } from './types';

interface AdminNodeListProps {
  nodes: ForumNode[];
  depth: number;
  onCreateUnder: (node: ForumNode) => void;
  onMove: (node: ForumNode) => void;
  onReorder: (parent: ForumNode) => void;
  onMoveDirection: (id: string, parent: ForumNode, dir: 'up' | 'down') => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Admin Node List component.
 */
export function AdminNodeList({
  nodes,
  depth,
  onCreateUnder,
  onMove,
  onReorder,
  onMoveDirection,
}: AdminNodeListProps): React.ReactElement {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <div key={node.id}>
          <GlassCard
            variant="default"
            className="flex items-center gap-3 px-4 py-2"
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <span className="flex-1 truncate text-sm font-medium text-white">{node.name}</span>

            <span className="rounded bg-white/[0.08] px-2 py-0.5 text-xs capitalize text-gray-400">
              {node.forum_type}
            </span>

            <div className="flex items-center gap-1">
              <IconButton
                icon={<FolderPlusIcon className="h-3.5 w-3.5" />}
                title="Create subforum"
                onClick={() => onCreateUnder(node)}
              />
              <IconButton
                icon={<ArrowUturnUpIcon className="h-3.5 w-3.5" />}
                title="Move"
                onClick={() => onMove(node)}
              />
              {node.children && node.children.length > 1 && (
                <IconButton
                  icon={<ArrowsUpDownIcon className="h-3.5 w-3.5" />}
                  title="Reorder children"
                  onClick={() => onReorder(node)}
                />
              )}
            </div>
          </GlassCard>

          {node.children && node.children.length > 0 && (
            <AdminNodeList
              nodes={node.children}
              depth={depth + 1}
              onCreateUnder={onCreateUnder}
              onMove={onMove}
              onReorder={onReorder}
              onMoveDirection={onMoveDirection}
            />
          )}
        </div>
      ))}
    </div>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

function IconButton({ icon, title, onClick }: IconButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {icon}
    </button>
  );
}
