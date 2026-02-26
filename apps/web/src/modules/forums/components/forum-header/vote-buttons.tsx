/**
 * Vote Buttons Component
 *
 * Forum upvote/downvote controls with animated feedback.
 */

import { durations } from '@cgraph/animation-constants';
import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { formatNumber } from './utils';
import type { VoteButtonsProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';

const floatingIndicator = {
  initial: { opacity: 1, y: 0, scale: 0.8 },
  animate: { opacity: 0, y: -24, scale: 1 },
  transition: { duration: durations.dramatic.ms / 1000, ease: 'easeOut' as const },
};

export const VoteButtons = memo(function VoteButtons({
  userVote,
  score,
  onVote,
  isVoting,
}: VoteButtonsProps) {
  const [voteAnim, setVoteAnim] = useState<'+1' | '-1' | null>(null);

  const handleVote = useCallback(
    (direction: 1 | -1) => {
      onVote(direction);
      setVoteAnim(direction === 1 ? '+1' : '-1');
      setTimeout(() => setVoteAnim(null), 600);
    },
    [onVote]
  );

  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          userVote === 1 ? 'bg-green-500/20 text-green-500' : 'text-gray-400 hover:bg-dark-600'
        }`}
        animate={
          userVote === 1
            ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {userVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <motion.span
        key={score}
        className={`text-lg font-bold ${
          score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-400'
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tweens.fast}
      >
        {formatNumber(score)}
      </motion.span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          userVote === -1 ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:bg-dark-600'
        }`}
        animate={
          userVote === -1
            ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {userVote === -1 ? (
          <ArrowDownIconSolid className="h-6 w-6" />
        ) : (
          <ArrowDownIcon className="h-6 w-6" />
        )}
      </motion.button>

      {/* Floating vote indicator */}
      <AnimatePresence>
        {voteAnim && (
          <motion.span
            className={`pointer-events-none absolute top-0 text-sm font-bold ${
              voteAnim === '+1' ? 'text-green-400' : 'text-red-400'
            }`}
            {...floatingIndicator}
          >
            {voteAnim}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});
