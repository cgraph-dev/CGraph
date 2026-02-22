import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from '@heroicons/react/24/solid';

import type { ThreadRowProps } from './types';

/**
 * Individual thread row component displaying thread info, reply/view counts, and last reply
 */
export function ThreadRow({ thread, forumSlug }: ThreadRowProps) {
  return (
    <Link
      to={`/forums/${forumSlug}/threads/${thread.id}`}
      className="grid grid-cols-12 gap-4 border-b border-dark-600 px-4 py-4 transition-colors last:border-b-0 hover:bg-dark-600/50"
    >
      {/* Thread Info */}
      <div className="col-span-6 flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          {thread.isPinned ? (
            <MapPinIcon className="h-5 w-5 text-yellow-500" />
          ) : thread.isLocked ? (
            <LockClosedIcon className="h-5 w-5 text-red-400" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-white transition-colors hover:text-primary-400">
              {thread.title}
            </h3>
            {thread.isPinned && (
              <span className="rounded bg-yellow-600/20 px-1.5 py-0.5 text-xs text-yellow-400">
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-xs text-red-400">
                Locked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            by {thread.author?.displayName || thread.author?.username || 'Unknown'} ·{' '}
            {new Date(thread.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Reply Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        {(thread.replyCount ?? 0).toLocaleString()}
      </div>

      {/* View Count */}
      <div className="col-span-2 flex items-center justify-center text-gray-300">
        <EyeIcon className="mr-1 h-4 w-4 text-gray-500" />
        {(thread.viewCount ?? 0).toLocaleString()}
      </div>

      {/* Last Reply */}
      <div className="col-span-2 text-sm text-gray-400">
        {thread.lastReplyAt ? (
          <div>
            <p className="text-xs">{thread.lastReplyBy || 'Unknown'}</p>
            <p className="text-xs text-gray-500">
              {new Date(thread.lastReplyAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <span className="text-gray-500">No replies</span>
        )}
      </div>
    </Link>
  );
}
