import { useNavigate } from 'react-router-dom';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/solid';

import { BoardRow } from './board-row';
import { SKELETON_COUNTS } from './constants';
import type { BoardsListProps } from './types';

/**
 * List of boards in a forum with MyBB-style table layout
 */
export function BoardsList({ boards, forumSlug, isLoading, isOwner }: BoardsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(SKELETON_COUNTS.boards)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="py-12 text-center">
        <FolderIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <h3 className="mb-2 text-xl font-bold text-white">No Boards Yet</h3>
        <p className="mb-4 text-gray-400">
          {isOwner
            ? 'Create your first board to organize discussions.'
            : "This forum doesn't have any boards yet."}
        </p>
        {isOwner && (
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        )}
      </div>
    );
  }

  // Group boards by parent (for hierarchical display)
  const topLevelBoards = boards.filter((b) => !b.parentId);

  return (
    <div className="space-y-4">
      {/* Create Board Button */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/forums/${forumSlug}/boards/new`)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create Board
          </button>
        </div>
      )}

      {/* Boards Table */}
      <div className="overflow-hidden rounded-lg bg-dark-700">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-dark-600 bg-dark-800 px-4 py-3 text-sm font-medium text-gray-400">
          <div className="col-span-6">Board</div>
          <div className="col-span-2 text-center">Threads</div>
          <div className="col-span-2 text-center">Posts</div>
          <div className="col-span-2">Last Post</div>
        </div>

        {/* Board Rows */}
        {topLevelBoards.map((board) => (
          <BoardRow key={board.id} board={board} forumSlug={forumSlug} />
        ))}
      </div>
    </div>
  );
}
