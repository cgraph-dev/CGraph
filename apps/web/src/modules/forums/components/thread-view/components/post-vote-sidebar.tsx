/**
 * PostVoteSidebar Component
 *
 * Vertical vote controls for a forum post with animated feedback.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { springs } from '@/lib/animation-presets/presets';

interface PostVoteSidebarProps {
  score: number;
  myVote?: 1 | -1 | null;
  onVote: (direction: 1 | -1) => void;
}

const floatingIndicator = {
  initial: { opacity: 1, y: 0, scale: 0.8 },
  animate: { opacity: 0, y: -24, scale: 1 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

export function PostVoteSidebar({ score, myVote, onVote }: PostVoteSidebarProps) {
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
    <div className="relative flex min-w-[60px] flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(1)}
        className={`rounded p-1 ${
          myVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-400'
        }`}
        animate={
          myVote === 1
            ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {myVote === 1 ? (
          <ArrowUpIconSolid className="h-6 w-6" />
        ) : (
          <ArrowUpIcon className="h-6 w-6" />
        )}
      </motion.button>
      <motion.span
        key={score}
        className="text-lg font-bold"
        style={{ color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : 'inherit' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {score}
      </motion.span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote(-1)}
        className={`rounded p-1 ${
          myVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
        }`}
        animate={
          myVote === -1
            ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={springs.snappy}
      >
        {myVote === -1 ? (
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
}
