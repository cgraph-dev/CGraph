/**
 * PostVoteSidebar Component
 *
 * Vertical vote controls for a forum post.
 */

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';

interface PostVoteSidebarProps {
  score: number;
  myVote?: 1 | -1 | null;
  onVote: (direction: 1 | -1) => void;
}

export function PostVoteSidebar({ score, myVote, onVote }: PostVoteSidebarProps) {
  return (
    <div className="flex min-w-[60px] flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onVote(1)}
        className={`rounded p-1 ${myVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-400'}`}
      >
        {myVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <span
        className="text-lg font-bold"
        style={{ color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : 'inherit' }}
      >
        {score}
      </span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onVote(-1)}
        className={`rounded p-1 ${myVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
      >
        {myVote === -1 ? (
          <ArrowDownIconSolid className="h-6 w-6" />
        ) : (
          <ArrowDownIcon className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
