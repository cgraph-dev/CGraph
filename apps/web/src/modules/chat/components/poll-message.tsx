/**
 * PollMessage - Renders a poll inside a chat message
 * Supports single/multi choice voting with animated progress bars
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { tweens } from '@/lib/animation-presets';

interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs who voted
}

interface PollMessageProps {
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  anonymous: boolean;
  creatorName: string;
  onVote: (optionId: string) => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Poll Message component.
 */
export function PollMessage({
  question,
  options,
  multipleChoice,
  anonymous,
  creatorName,
  onVote,
}: PollMessageProps) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.votes.length, 0),
    [options],
  );

  const hasVoted = useMemo(
    () => options.some((o) => o.votes.includes(userId || '')),
    [options, userId],
  );

  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-dark-700/50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <ChartBarIcon className="h-4 w-4 text-primary-400" />
        <span className="text-xs text-white/40">Poll by {creatorName}</span>
        {multipleChoice && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">
            Multi-select
          </span>
        )}
      </div>

      {/* Question */}
      <h4 className="mb-3 text-sm font-semibold text-white">{question}</h4>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const pct = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
          const isSelected = option.votes.includes(userId || '');

          return (
            <button
              key={option.id}
              onClick={() => onVote(option.id)}
              disabled={!multipleChoice && hasVoted}
              className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                isSelected
                  ? 'border-primary-500/50 text-white'
                  : 'border-white/10 text-white/70 hover:border-white/20 hover:bg-white/5'
              } ${!multipleChoice && hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Progress bar */}
              {hasVoted && (
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? 'bg-primary-500/20' : 'bg-white/5'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={tweens.smooth}
                />
              )}

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <CheckCircleIcon className="h-4 w-4 text-primary-400" />
                  )}
                  <span>{option.text}</span>
                </div>
                {hasVoted && (
                  <span className="text-xs text-white/40">
                    {option.votes.length} ({Math.round(pct)}%)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 text-xs text-white/30">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        {anonymous && ' · Anonymous'}
      </div>
    </div>
  );
}
