/**
 * Comment Actions
 *
 * Vote buttons, reply button, and mark best answer action.
 * Animated with Framer Motion — scale bounce on vote, floating +1/-1 indicator.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpIcon, ArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { tweens, springs } from '@/lib/animation-presets';
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

/**
 * unknown for the forums module.
 */
/**
 * Comment Actions component.
 */
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
  const [voteAnim, setVoteAnim] = useState<string | null>(null);

  const handleVote = useCallback((value: 1 | -1) => {
    onVote(value);
    setVoteAnim(value === 1 ? '+1' : '-1');
    setTimeout(() => setVoteAnim(null), 600);
  }, [onVote]);

  return (
    <div className="mt-3 flex items-center gap-4">
      {/* Vote Buttons */}
      <div className="relative flex items-center gap-1">
        <motion.button
          onClick={() => handleVote(1)}
          disabled={isVoting}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={currentVote === 1 ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] } : {}}
          transition={springs.bouncy}
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
        </motion.button>
        <motion.span
          key={score}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snappy}
          className={`min-w-[2ch] text-center text-sm font-medium ${
            score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {score}
        </motion.span>
        <motion.button
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={currentVote === -1 ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : {}}
          transition={springs.bouncy}
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
        </motion.button>

        {/* Floating +1/-1 indicator */}
        <AnimatePresence>
          {voteAnim && (
            <motion.span
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -20, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={tweens.emphatic}
              className={`pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold ${
                voteAnim === '+1' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {voteAnim}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Reply Button */}
      <motion.button
        onClick={onReply}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-dark-600 hover:text-white"
      >
        <ChatBubbleLeftIcon className="h-4 w-4" />
        Reply
      </motion.button>

      {/* Mark Best Answer */}
      {canMarkBestAnswer && !isBestAnswer && (
        <motion.button
          onClick={onMarkBestAnswer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-400 hover:bg-green-500/20 hover:text-green-400"
        >
          ✓ Mark as Best
        </motion.button>
      )}
    </div>
  );
}
