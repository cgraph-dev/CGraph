/**
 * Comment Actions
 *
 * Vote buttons, reply button, and mark best answer action.
 */

import { ArrowUpIcon, ArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';

interface CommentActionsProps {
  score: number;
  currentVote: 1 | -1 | null;
  isBestAnswer?: boolean;
  canMarkBestAnswer: boolean;
  isVoting: boolean;
  onVote: (value: 1 | -1) => void;
  onReply: () => void;
  onMarkBestAnswer?: () => void;
}

export function CommentActions({
  score,
  currentVote,
  isBestAnswer,
  canMarkBestAnswer,
  isVoting,
  onVote,
  onReply,
  onMarkBestAnswer,
}: CommentActionsProps) {
  return (
    <div className="mt-3 flex items-center gap-4">
      {/* Vote Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onVote(1)}
          disabled={isVoting}
          className={`rounded p-1 transition-colors ${
            currentVote === 1
              ? 'text-green-500'
              : 'text-gray-400 hover:bg-dark-600 hover:text-green-400'
          }`}
          aria-label="Upvote"
        >
          {currentVote === 1 ? (
            <ArrowUpIconSolid className="h-4 w-4" />
          ) : (
            <ArrowUpIcon className="h-4 w-4" />
          )}
        </button>
        <span
          className={`min-w-[2ch] text-center text-sm font-medium ${
            score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => onVote(-1)}
          disabled={isVoting}
          className={`rounded p-1 transition-colors ${
            currentVote === -1
              ? 'text-red-500'
              : 'text-gray-400 hover:bg-dark-600 hover:text-red-400'
          }`}
          aria-label="Downvote"
        >
          {currentVote === -1 ? (
            <ArrowDownIconSolid className="h-4 w-4" />
          ) : (
            <ArrowDownIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Reply Button */}
      <button
        onClick={onReply}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-dark-600 hover:text-white"
      >
        <ChatBubbleLeftIcon className="h-4 w-4" />
        Reply
      </button>

      {/* Mark Best Answer */}
      {canMarkBestAnswer && !isBestAnswer && (
        <button
          onClick={onMarkBestAnswer}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-green-500/20 hover:text-green-400"
        >
          ✓ Mark as Best
        </button>
      )}
    </div>
  );
}
