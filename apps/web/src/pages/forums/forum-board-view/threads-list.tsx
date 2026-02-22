import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

import { ThreadRow } from './thread-row';
import { SKELETON_COUNTS } from './constants';
import type { ThreadsListProps } from './types';

/**
 * List of threads in a forum with MyBB-style table layout
 */
export function ThreadsList({ threads, forumSlug, isLoading }: ThreadsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(SKELETON_COUNTS.threads)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <h3 className="mb-2 text-xl font-bold text-white">No Threads Yet</h3>
        <p className="text-gray-400">
          Start a discussion by creating a thread in one of the boards.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-dark-700">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-dark-600 bg-dark-800 px-4 py-3 text-sm font-medium text-gray-400">
        <div className="col-span-6">Thread</div>
        <div className="col-span-2 text-center">Replies</div>
        <div className="col-span-2 text-center">Views</div>
        <div className="col-span-2">Last Reply</div>
      </div>

      {/* Thread Rows */}
      {threads.map((thread) => (
        <ThreadRow key={thread.id} thread={thread} forumSlug={forumSlug} />
      ))}
    </div>
  );
}
