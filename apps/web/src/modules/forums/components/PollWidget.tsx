/**
 * PollWidget Component
 * Interactive poll system with voting, results visualization, and voter list
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useForumStore, type Poll } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { GlassCard } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PollWidget');

interface PollWidgetProps {
  poll: Poll;
  threadId: string;
  isCreator?: boolean;
  className?: string;
}

export default function PollWidget({ poll, isCreator = false, className = '' }: PollWidgetProps) {
  const { votePoll, closePoll } = useForumStore();
  const { user } = useAuthStore();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoters, setShowVoters] = useState<string | null>(null);

  const hasVoted = poll.options.some((option) => option.voters?.includes(user?.id || ''));
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const isPollClosed = poll.closed || Boolean(poll.timeout && new Date(poll.timeout) < new Date());

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isPollClosed) return;

    if (poll.allowMultiple) {
      setSelectedOptions((prev) => {
        const newSelection = prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];

        // Check max selections
        if (poll.maxSelections && newSelection.length > poll.maxSelections) {
          return prev;
        }

        return newSelection;
      });
    } else {
      setSelectedOptions([optionId]);
    }

    HapticFeedback.light();
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await votePoll(poll.id, selectedOptions);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to vote:', error);
      HapticFeedback.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePoll = async () => {
    if (!isCreator) return;

    try {
      await closePoll(poll.id);
      HapticFeedback.medium();
    } catch (error) {
      logger.error('Failed to close poll:', error);
      HapticFeedback.error();
    }
  };

  const getPercentage = (votes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatTimeRemaining = (): string => {
    if (!poll.timeout) return '';
    const now = new Date();
    const end = new Date(poll.timeout);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Ending soon';
  };

  return (
    <GlassCard className={`p-6 ${className}`} variant="frosted">
      {/* Poll Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-white">{poll.question}</h3>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </span>
            {poll.timeout && !isPollClosed && (
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {formatTimeRemaining()}
              </span>
            )}
            {isPollClosed && (
              <span className="flex items-center gap-1 text-red-400">
                <LockClosedIcon className="h-4 w-4" />
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Close Poll Button (Creator Only) */}
        {isCreator && !isPollClosed && (
          <motion.button
            onClick={handleClosePoll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg border border-red-500 bg-red-500/20 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/30"
          >
            Close Poll
          </motion.button>
        )}
      </div>

      {/* Poll Options */}
      <div className="mb-4 space-y-3">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOptions.includes(option.id);
          const showResults = hasVoted || isPollClosed;

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {showResults ? (
                // Results View
                <div className="relative overflow-hidden rounded-lg border border-dark-600 bg-dark-800/50 p-3">
                  {/* Progress Bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20"
                  />

                  {/* Content */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{option.text}</span>
                      {option.voters?.includes(user?.id || '') && (
                        <CheckCircleIcon className="h-5 w-5 text-primary-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{option.votes} votes</span>
                      <span className="text-lg font-bold text-primary-400">{percentage}%</span>
                    </div>
                  </div>

                  {/* Voter List (if public poll) */}
                  {poll.public && option.voters && option.voters.length > 0 && (
                    <motion.button
                      onClick={() => setShowVoters(showVoters === option.id ? null : option.id)}
                      className="mt-2 text-xs text-primary-400 transition-colors hover:text-primary-300"
                    >
                      {showVoters === option.id ? 'Hide' : 'Show'} voters ({option.voters.length})
                    </motion.button>
                  )}

                  {/* Voter Names */}
                  <AnimatePresence>
                    {showVoters === option.id && poll.public && option.voters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 border-t border-dark-600 pt-2"
                      >
                        <div className="flex flex-wrap gap-2">
                          {option.voters.slice(0, 10).map((voterId) => (
                            <span
                              key={voterId}
                              className="rounded bg-dark-700 px-2 py-1 text-xs text-gray-400"
                            >
                              User {voterId.slice(0, 8)}
                            </span>
                          ))}
                          {option.voters.length > 10 && (
                            <span className="text-xs text-gray-500">
                              +{option.voters.length - 10} more
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Voting View
                <motion.button
                  onClick={() => handleOptionToggle(option.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isPollClosed}
                  className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-dark-600 bg-dark-800/50 hover:border-primary-500/50'
                  } ${isPollClosed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
                >
                  <div className="flex items-center gap-3">
                    {poll.allowMultiple ? (
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-500'} `}
                      >
                        {isSelected && <CheckCircleIcon className="h-4 w-4 text-white" />}
                      </div>
                    ) : (
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? 'border-primary-500' : 'border-gray-500'} `}
                      >
                        {isSelected && <div className="h-3 w-3 rounded-full bg-primary-500" />}
                      </div>
                    )}
                    <span className="font-medium text-white">{option.text}</span>
                  </div>
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Vote Button */}
      {!hasVoted && !isPollClosed && (
        <motion.button
          onClick={handleSubmitVote}
          disabled={selectedOptions.length === 0 || isSubmitting}
          whileHover={{ scale: selectedOptions.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selectedOptions.length > 0 ? 0.98 : 1 }}
          className={`w-full rounded-lg py-3 font-semibold transition-all ${
            selectedOptions.length > 0
              ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-lg hover:shadow-primary-500/50'
              : 'cursor-not-allowed bg-dark-700 text-gray-500'
          } ${isSubmitting ? 'opacity-50' : ''} `}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </motion.button>
      )}

      {/* Poll Info */}
      <div className="mt-4 border-t border-dark-600 pt-4 text-xs text-gray-500">
        {poll.allowMultiple && !hasVoted && !isPollClosed && (
          <p>
            Multiple choice poll
            {poll.maxSelections &&
              ` (max ${poll.maxSelections} selection${poll.maxSelections > 1 ? 's' : ''})`}
          </p>
        )}
        {poll.public ? (
          <p>Public poll - voters are visible</p>
        ) : (
          <p>Anonymous poll - voters are hidden</p>
        )}
      </div>
    </GlassCard>
  );
}
