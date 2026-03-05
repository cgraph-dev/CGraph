/**
 * Vote Button — Animated upvote/downvote pair (Reddit-style)
 *
 * Features:
 * - Vertical layout: up arrow | count | down arrow
 * - Brand color when upvoted, red when downvoted
 * - Count animates with roll transition
 * - Click toggles, second click same direction removes vote
 * - Compact horizontal variant for list view
 *
 * @module modules/forums/components/vote-button
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface VoteButtonProps {
  /** Current total vote count */
  count: number;
  /** Current user vote state */
  userVote?: 'up' | 'down' | null;
  /** Called when vote changes */
  onVote?: (direction: 'up' | 'down' | null) => void;
  /** Horizontal layout for compact views */
  horizontal?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

// ── Animated Count ─────────────────────────────────────────────────────

function AnimatedCount({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: value > 0 ? -12 : 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: value > 0 ? 12 : -12, opacity: 0 }}
          transition={springs.snappy}
          className="block text-center tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ── Arrow Icons ────────────────────────────────────────────────────────

function UpArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cn('h-4 w-4', className)}>
      <path d="M12 4l-7 7h4v9h6v-9h4l-7-7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DownArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={cn('h-4 w-4', className)}>
      <path d="M12 20l7-7h-4v-9h-6v9h-4l7 7z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export function VoteButton({
  count,
  userVote = null,
  onVote,
  horizontal = false,
  size = 'md',
  className,
}: VoteButtonProps) {
  const [localVote, setLocalVote] = useState(userVote);
  const [localCount, setLocalCount] = useState(count);

  const handleVote = useCallback(
    (direction: 'up' | 'down') => {
      let newVote: 'up' | 'down' | null;
      let delta = 0;

      if (localVote === direction) {
        // Same direction = remove vote
        newVote = null;
        delta = direction === 'up' ? -1 : 1;
      } else if (localVote === null) {
        // No vote → new vote
        newVote = direction;
        delta = direction === 'up' ? 1 : -1;
      } else {
        // Opposite direction → swing
        newVote = direction;
        delta = direction === 'up' ? 2 : -2;
      }

      setLocalVote(newVote);
      setLocalCount((prev) => prev + delta);
      onVote?.(newVote);
    },
    [localVote, onVote],
  );

  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';

  if (horizontal) {
    return (
      <div className={cn('flex items-center gap-1', sizeClasses, className)}>
        <motion.button
          onClick={() => handleVote('up')}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85, rotate: -15 }}
          className={cn(
            'rounded p-1 transition-colors',
            localVote === 'up' ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300',
          )}
        >
          <UpArrow className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        </motion.button>

        <AnimatedCount
          value={localCount}
          className={cn(
            'min-w-[20px] font-bold',
            localVote === 'up' && 'text-primary-400',
            localVote === 'down' && 'text-red-400',
            !localVote && 'text-gray-400',
          )}
        />

        <motion.button
          onClick={() => handleVote('down')}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85, rotate: 15 }}
          className={cn(
            'rounded p-1 transition-colors',
            localVote === 'down' ? 'text-red-400' : 'text-gray-500 hover:text-gray-300',
          )}
        >
          <DownArrow className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        </motion.button>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className={cn('flex flex-col items-center gap-0.5', sizeClasses, className)}>
      <motion.button
        onClick={() => handleVote('up')}
        whileHover={{ scale: 1.2, y: -1 }}
        whileTap={{ scale: 0.8 }}
        className={cn(
          'rounded-md p-1 transition-colors',
          localVote === 'up'
            ? 'bg-primary-600/20 text-primary-400'
            : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
        )}
      >
        <UpArrow className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
      </motion.button>

      <AnimatedCount
        value={localCount}
        className={cn(
          'min-w-[24px] font-bold',
          localVote === 'up' && 'text-primary-400',
          localVote === 'down' && 'text-red-400',
          !localVote && 'text-gray-400',
        )}
      />

      <motion.button
        onClick={() => handleVote('down')}
        whileHover={{ scale: 1.2, y: 1 }}
        whileTap={{ scale: 0.8 }}
        className={cn(
          'rounded-md p-1 transition-colors',
          localVote === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
        )}
      >
        <DownArrow className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
      </motion.button>
    </div>
  );
}

export default VoteButton;
