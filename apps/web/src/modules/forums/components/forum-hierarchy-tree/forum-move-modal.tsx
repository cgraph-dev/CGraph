/**
 * Move forum modal
 * @module modules/forums/components/forum-hierarchy-tree
 */

import { ArrowUturnUpIcon } from '@heroicons/react/24/outline';
import { Modal } from './forum-admin-modal';
import { flattenTree } from './use-forum-hierarchy-admin';
import type { ForumNode } from './types';

interface MoveModalProps {
  tree: ForumNode[];
  movingForum: ForumNode;
  saving: boolean;
  onClose: () => void;
  onMove: (targetParentId: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Move Modal dialog component.
 */
export function MoveModal({
  tree,
  movingForum,
  saving,
  onClose,
  onMove,
}: MoveModalProps): React.ReactElement {
  return (
    <Modal onClose={onClose} title={`Move "${movingForum.name}"`}>
      <p className="mb-4 text-sm text-gray-400">Select new parent:</p>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {flattenTree(tree)
          .filter((f) => f.node.id !== movingForum.id)
          .map(({ node, depth }) => (
            <button
              key={node.id}
              onClick={() => onMove(node.id)}
              disabled={saving}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-white/5"
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              <ArrowUturnUpIcon className="h-3.5 w-3.5 text-gray-500" />
              {node.name}
            </button>
          ))}
      </div>
    </Modal>
  );
}
