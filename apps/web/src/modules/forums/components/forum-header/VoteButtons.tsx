/**
 * Vote Buttons Component
 *
 * Forum upvote/downvote controls
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { formatNumber } from './utils';
import type { VoteButtonsProps } from './types';

export const VoteButtons = memo(function VoteButtons({
  userVote,
  score,
  onVote,
  isVoting,
}: VoteButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onVote(1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          userVote === 1 ? 'bg-green-500/20 text-green-500' : 'text-gray-400 hover:bg-dark-600'
        }`}
      >
        {userVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <span
        className={`text-lg font-bold ${
          score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-400'
        }`}
      >
        {formatNumber(score)}
      </span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onVote(-1)}
        disabled={isVoting}
        className={`rounded-lg p-2 transition-colors ${
          userVote === -1 ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:bg-dark-600'
        }`}
      >
        {userVote === -1 ? (
          <ArrowDownIconSolid className="h-6 w-6" />
        ) : (
          <ArrowDownIcon className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
});
