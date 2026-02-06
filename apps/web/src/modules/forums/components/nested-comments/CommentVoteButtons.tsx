/**
 * Comment Vote Buttons Component
 *
 * Handles upvote/downvote with visual feedback
 */

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { CommentVoteButtonsProps } from './types';

export function CommentVoteButtons({ comment, onVote }: CommentVoteButtonsProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-dark-800/50 px-2 py-1">
      <motion.button
        onClick={() => {
          onVote(comment.id, comment.userVote === 1 ? null : 1);
          HapticFeedback.light();
        }}
        className={`rounded p-1 transition-colors ${
          comment.userVote === 1 ? 'text-primary-400' : 'text-gray-400 hover:text-primary-400'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {comment.userVote === 1 ? (
          <ArrowUpIconSolid className="h-4 w-4" />
        ) : (
          <ArrowUpIcon className="h-4 w-4" />
        )}
      </motion.button>
      <span
        className={`min-w-[24px] text-center text-sm font-semibold ${
          comment.score > 0
            ? 'text-primary-400'
            : comment.score < 0
              ? 'text-red-400'
              : 'text-gray-400'
        }`}
      >
        {comment.score}
      </span>
      <motion.button
        onClick={() => {
          onVote(comment.id, comment.userVote === -1 ? null : -1);
          HapticFeedback.light();
        }}
        className={`rounded p-1 transition-colors ${
          comment.userVote === -1 ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {comment.userVote === -1 ? (
          <ArrowDownIconSolid className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        )}
      </motion.button>
    </div>
  );
}
