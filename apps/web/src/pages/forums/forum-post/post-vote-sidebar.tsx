/**
 * Vertical vote control sidebar with up/down arrows and score display.
 * @module pages/forums/forum-post/post-vote-sidebar
 */
/**
 * Post Vote Sidebar
 *
 * Vertical vote control with up/down arrows and score display.
 *
 * @module pages/forums/forum-post/PostVoteSidebar
 */

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';

/** Props for PostVoteSidebar */
export interface PostVoteSidebarProps {
  /** Current post ID */
  postId: string;
  /** Net vote score */
  score: number;
  /** Current user's vote (1, -1, or null) */
  myVote: 1 | -1 | null;
  /** Vote handler */
  onVote: (type: 'post' | 'comment', id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
}

/** Vertical vote sidebar for a forum post */
export function PostVoteSidebar({ postId, score, myVote, onVote }: PostVoteSidebarProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-l-lg bg-white/[0.06] p-4">
      <button
        onClick={() => onVote('post', postId, 1, myVote)}
        className={`rounded p-1 transition-colors hover:bg-white/[0.10] ${
          myVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
        }`}
      >
        {myVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </button>
      <span
        className={`text-lg font-medium ${
          myVote === 1 ? 'text-orange-500' : myVote === -1 ? 'text-blue-500' : 'text-white'
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => onVote('post', postId, -1, myVote)}
        className={`rounded p-1 transition-colors hover:bg-white/[0.10] ${
          myVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
        }`}
      >
        {myVote === -1 ? (
          <ArrowDownIconSolid className="h-6 w-6" />
        ) : (
          <ArrowDownIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
