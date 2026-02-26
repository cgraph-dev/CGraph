/**
 * Comment Vote Buttons Component
 *
 * Handles upvote/downvote with visual feedback and animations.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { CommentVoteButtonsProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';

const floatingIndicator = {
  initial: { opacity: 1, y: 0, scale: 0.8 },
  animate: { opacity: 0, y: -20, scale: 1 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

/**
 * unknown for the forums module.
 */
/**
 * Comment Vote Buttons component.
 */
export function CommentVoteButtons({ comment, onVote }: CommentVoteButtonsProps) {
  const [voteAnim, setVoteAnim] = useState<'+1' | '-1' | null>(null);

  const handleVote = useCallback(
    (direction: 1 | -1) => {
      const newVote = comment.userVote === direction ? null : direction;
      onVote(comment.id, newVote);
      HapticFeedback.light();
      if (newVote !== null) {
        setVoteAnim(newVote === 1 ? '+1' : '-1');
        setTimeout(() => setVoteAnim(null), 600);
      }
    },
    [comment.id, comment.userVote, onVote]
  );

  return (
    <div className="relative flex items-center gap-2 rounded-lg bg-dark-800/50 px-2 py-1">
      <motion.button
        onClick={() => handleVote(1)}
        className={`rounded p-1 transition-colors ${
          comment.userVote === 1 ? 'text-primary-400' : 'text-gray-400 hover:text-primary-400'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={
          comment.userVote === 1
            ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {comment.userVote === 1 ? (
          <ArrowUpIconSolid className="h-4 w-4" />
        ) : (
          <ArrowUpIcon className="h-4 w-4" />
        )}
      </motion.button>
      <motion.span
        key={comment.score}
        className={`min-w-[24px] text-center text-sm font-semibold ${
          comment.score > 0
            ? 'text-primary-400'
            : comment.score < 0
              ? 'text-red-400'
              : 'text-gray-400'
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tweens.fast}
      >
        {comment.score}
      </motion.span>
      <motion.button
        onClick={() => handleVote(-1)}
        className={`rounded p-1 transition-colors ${
          comment.userVote === -1 ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={
          comment.userVote === -1
            ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {comment.userVote === -1 ? (
          <ArrowDownIconSolid className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        )}
      </motion.button>

      {/* Floating vote indicator */}
      <AnimatePresence>
        {voteAnim && (
          <motion.span
            className={`pointer-events-none absolute left-1/2 -top-2 -translate-x-1/2 text-xs font-bold ${
              voteAnim === '+1' ? 'text-primary-400' : 'text-red-400'
            }`}
            {...floatingIndicator}
          >
            {voteAnim}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
