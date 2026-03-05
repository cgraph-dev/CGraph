/**
 * Poll Card — Embedded poll within forum posts
 *
 * Features:
 * - Options as animated progress bars with vote percentage
 * - Own vote highlighted
 * - Total voters + time remaining
 * - Vote/Change Vote button
 * - Results revealed after voting
 * - Animated bar width transitions
 *
 * @module modules/forums/components/poll-card
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChartBarIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

interface PollCardProps {
  question?: string;
  options: PollOption[];
  totalVoters: number;
  /** User's selected option ID(s) */
  userVotes?: string[];
  /** Allow multiple selections */
  multiVote?: boolean;
  /** Expiry date ISO string — undefined means no expiry */
  expiresAt?: string;
  /** Whether poll is closed */
  isClosed?: boolean;
  onVote?: (optionIds: string[]) => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

// ── Component ──────────────────────────────────────────────────────────

export function PollCard({
  question,
  options,
  totalVoters,
  userVotes = [],
  multiVote = false,
  expiresAt,
  isClosed = false,
  onVote,
  className,
}: PollCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(userVotes));
  const hasVoted = userVotes.length > 0;
  const showResults = hasVoted || isClosed;
  const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);

  const toggleOption = useCallback(
    (optionId: string) => {
      if (showResults && !isClosed) {
        // Allow changing vote
        setSelected(new Set([optionId]));
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          if (!multiVote) next.clear();
          next.add(optionId);
        }
        return next;
      });
    },
    [showResults, isClosed, multiVote],
  );

  const handleSubmit = useCallback(() => {
    if (selected.size === 0) return;
    onVote?.([...selected]);
  }, [selected, onVote]);

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] p-4',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <ChartBarIcon className="h-4 w-4 text-primary-400" />
        <span className="text-sm font-bold text-gray-200">
          {question ?? 'Poll'}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const pct = totalVoters > 0 ? Math.round((option.voteCount / totalVoters) * 100) : 0;
          const isSelected = selected.has(option.id) || userVotes.includes(option.id);
          const isWinning = option.voteCount === maxVotes && showResults;

          return (
            <motion.button
              key={option.id}
              onClick={() => !isClosed && toggleOption(option.id)}
              disabled={isClosed}
              whileHover={!isClosed ? { scale: 1.01 } : undefined}
              whileTap={!isClosed ? { scale: 0.99 } : undefined}
              className={cn(
                'relative w-full overflow-hidden rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-primary-500/40 bg-primary-600/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]',
                isClosed && 'cursor-default',
              )}
            >
              {/* Progress bar */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={springs.snappy}
                  className={cn(
                    'absolute inset-y-0 left-0',
                    isWinning ? 'bg-primary-600/20' : 'bg-white/[0.04]',
                  )}
                />
              )}

              <div className="relative flex items-center gap-2 px-3 py-2.5">
                {/* Checkbox / Radio indicator */}
                <div
                  className={cn(
                    'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary-500 bg-primary-600' : 'border-white/20',
                    multiVote && 'rounded',
                  )}
                >
                  {isSelected && <CheckIcon className="h-2.5 w-2.5 text-white" />}
                </div>

                {/* Option text */}
                <span
                  className={cn(
                    'flex-1 text-sm',
                    isSelected ? 'font-semibold text-white' : 'text-gray-300',
                  )}
                >
                  {option.text}
                </span>

                {/* Percentage */}
                {showResults && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'text-xs font-bold',
                      isWinning ? 'text-primary-400' : 'text-gray-500',
                    )}
                  >
                    {pct}%
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>{totalVoters} voter{totalVoters !== 1 ? 's' : ''}</span>
          {expiresAt && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {timeRemaining(expiresAt)}
            </span>
          )}
        </div>

        {!isClosed && (
          <motion.button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold',
              selected.size > 0
                ? 'bg-primary-600 text-white hover:bg-primary-500'
                : 'cursor-not-allowed bg-white/[0.04] text-gray-600',
            )}
          >
            {hasVoted ? 'Change Vote' : 'Vote'}
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default PollCard;
