import { Link } from 'react-router-dom';
import { FolderOpenIcon } from '@heroicons/react/24/solid';

import type { BoardRowProps } from './types';

/**
 * Individual board row component displaying board info, thread/post counts, and last post
 */
export function BoardRow({ board, forumSlug }: BoardRowProps) {
  return (
    <Link
      to={`/forums/${forumSlug}/boards/${board.slug}`}
      className="grid grid-cols-12 gap-4 border-b border-dark-600 px-4 py-4 transition-colors last:border-b-0 hover:bg-dark-600/50"
    >
      {/* Board Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="rounded-lg bg-primary-600/20 p-2">
          <FolderOpenIcon className="h-6 w-6 text-primary-400" />
        </div>
        <div>
          <h3 className="font-medium text-white transition-colors hover:text-primary-400">
            {board.name}
          </h3>
          {board.description && (
            <p className="line-clamp-1 text-sm text-gray-400">{board.description}</p>
          )}
        </div>
      </div>

      {/* Thread Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(board.threadCount ?? 0).toLocaleString()}
      </div>

      {/* Post Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(board.postCount ?? 0).toLocaleString()}
      </div>

      {/* Last Post */}
      <div className="col-span-2 text-sm text-gray-400">
        {board.lastPostAt ? (
          <div>
            <p className="truncate text-gray-300">{board.lastPostTitle || 'No title'}</p>
            <p className="text-xs">
              by {board.lastPostAuthor || 'Unknown'} ·{' '}
              {new Date(board.lastPostAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <span className="text-gray-500">No posts yet</span>
        )}
      </div>
    </Link>
  );
}
