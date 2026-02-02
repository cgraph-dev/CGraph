import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  SparklesIcon,
  ChevronRightIcon,
  FireIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore, Quest, QuestObjective } from '@/stores/gamificationStore';
import confetti from 'canvas-confetti';

/**
 * QuestPanel Component
 *
 * Displays active daily/weekly quests with progress tracking.
 * Features:
 * - Quest cards with progress bars
 * - Time remaining countdown
 * - Claim rewards button
 * - Quest completion celebration
 * - Expandable objective list
 */

interface QuestPanelProps {
  variant?: 'compact' | 'full';
  maxQuests?: number;
  className?: string;
  onQuestComplete?: (quest: Quest) => void;
}

export default function QuestPanel({
  variant = 'full',
  maxQuests = 5,
  className = '',
  onQuestComplete,
}: QuestPanelProps) {
  const { activeQuests, completedQuests, completeQuest, fetchQuests, isLoading } =
    useGamificationStore();
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Fetch quests on mount
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Update time remaining every minute
  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      activeQuests.forEach((quest) => {
        if (quest.expiresAt) {
          times[quest.id] = formatTimeRemaining(quest.expiresAt);
        }
      });
      setTimeRemaining(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, [activeQuests]);

  // Handle claiming quest rewards
  const handleClaimReward = useCallback(
    async (quest: Quest) => {
      if (claimingQuestId) return;

      setClaimingQuestId(quest.id);
      HapticFeedback.success();

      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#f59e0b'],
      });

      try {
        await completeQuest(quest.id);
        onQuestComplete?.(quest);
      } finally {
        setClaimingQuestId(null);
      }
    },
    [claimingQuestId, completeQuest, onQuestComplete]
  );

  // Check if all objectives are complete
  const isQuestReady = (quest: Quest): boolean => {
    return quest.objectives.every((obj) => obj.completed);
  };

  // Calculate quest progress percentage
  const getQuestProgress = (quest: Quest): number => {
    if (quest.objectives.length === 0) return 0;
    const totalProgress = quest.objectives.reduce((sum, obj) => {
      return sum + obj.currentValue / obj.targetValue;
    }, 0);
    return Math.min((totalProgress / quest.objectives.length) * 100, 100);
  };

  // Format time remaining
  function formatTimeRemaining(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  // Get quest type color
  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' };
      case 'weekly':
        return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' };
      case 'monthly':
        return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' };
      case 'special':
        return { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400' };
      default:
        return { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' };
    }
  };

  const displayedQuests = activeQuests.slice(0, maxQuests);
  const completedToday = completedQuests.filter((q) => {
    if (!q.completedAt) return false;
    const today = new Date().toDateString();
    return new Date(q.completedAt).toDateString() === today;
  }).length;

  if (variant === 'compact') {
    return (
      <div className={className}>
        <GlassCard variant="frosted" glow className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <TrophyIcon className="h-4 w-4 text-yellow-400" />
              Daily Quests
            </h3>
            <span className="text-xs text-gray-400">
              {completedToday}/{activeQuests.length + completedToday}
            </span>
          </div>

          <div className="space-y-2">
            {displayedQuests.slice(0, 3).map((quest) => {
              const progress = getQuestProgress(quest);
              const ready = isQuestReady(quest);

              return (
                <motion.div
                  key={quest.id}
                  className="flex items-center gap-3"
                  whileHover={{ x: 2 }}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      ready ? 'bg-green-500' : 'bg-dark-700'
                    }`}
                  >
                    {ready ? (
                      <CheckCircleSolidIcon className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-300">{quest.title}</p>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-dark-700">
                      <motion.div
                        className={`h-full rounded-full ${ready ? 'bg-green-500' : 'bg-primary-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {activeQuests.length > 3 && (
            <button className="mt-3 flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
              View all quests
              <ChevronRightIcon className="h-3 w-3" />
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="holographic" glow borderGradient className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <TrophyIcon className="h-6 w-6 text-yellow-400" />
            Active Quests
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              <span className="font-semibold text-primary-400">{completedToday}</span> completed
              today
            </div>
            <motion.button
              onClick={() => {
                fetchQuests();
                HapticFeedback.light();
              }}
              className="rounded-lg bg-dark-700 p-2 transition-colors hover:bg-dark-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SparklesIcon className="h-4 w-4 text-primary-400" />
            </motion.button>
          </div>
        </div>

        {/* Quest List */}
        {isLoading && activeQuests.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : activeQuests.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-700">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-gray-400">All quests completed!</p>
            <p className="mt-1 text-sm text-gray-500">Check back later for new quests</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayedQuests.map((quest, index) => {
                const typeColor = getQuestTypeColor(quest.type);
                const progress = getQuestProgress(quest);
                const ready = isQuestReady(quest);
                const isClaiming = claimingQuestId === quest.id;
                const isExpanded = expandedQuest === quest.id;

                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <GlassCard
                      variant={ready ? 'neon' : 'frosted'}
                      glow={ready}
                      className="cursor-pointer p-4"
                      onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Quest Icon */}
                        <motion.div
                          className={`h-12 w-12 rounded-xl ${typeColor.bg} border ${typeColor.border} flex flex-shrink-0 items-center justify-center`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {ready ? (
                            <GiftIcon className="h-6 w-6 text-green-400" />
                          ) : (
                            <FireIcon className={`h-6 w-6 ${typeColor.text}`} />
                          )}
                        </motion.div>

                        {/* Quest Info */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-semibold text-white">{quest.title}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor.bg} ${typeColor.text}`}
                            >
                              {quest.type}
                            </span>
                          </div>

                          <p className="mb-3 text-sm text-gray-400">{quest.description}</p>

                          {/* Progress Bar */}
                          <div className="relative">
                            <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                              <motion.div
                                className={`h-full rounded-full ${ready ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-purple-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            <span className="absolute -top-5 right-0 text-xs text-gray-400">
                              {Math.round(progress)}%
                            </span>
                          </div>

                          {/* Expanded Objectives */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 space-y-2 overflow-hidden"
                              >
                                {quest.objectives.map((obj, objIndex) => (
                                  <QuestObjectiveItem
                                    key={obj.id}
                                    objective={obj}
                                    index={objIndex}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Right Side - Time & Rewards */}
                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                          {/* Time Remaining */}
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <ClockIcon className="h-3 w-3" />
                            {timeRemaining[quest.id] || 'Loading...'}
                          </div>

                          {/* Rewards */}
                          <div className="flex items-center gap-1 text-sm">
                            <SparklesIcon className="h-4 w-4 text-yellow-400" />
                            <span className="font-semibold text-yellow-400">
                              +{quest.xpReward} XP
                            </span>
                          </div>

                          {/* Claim Button */}
                          {ready && !quest.completed && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimReward(quest);
                              }}
                              disabled={isClaiming}
                              className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-green-400 hover:to-emerald-400 disabled:opacity-50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isClaiming ? (
                                <motion.div
                                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                              ) : (
                                'Claim'
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Show More */}
        {activeQuests.length > maxQuests && (
          <motion.button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-dark-700 py-3 text-sm text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View {activeQuests.length - maxQuests} more quests
            <ChevronRightIcon className="h-4 w-4" />
          </motion.button>
        )}
      </GlassCard>
    </div>
  );
}

// Quest Objective Item Component
function QuestObjectiveItem({ objective, index }: { objective: QuestObjective; index: number }) {
  // Progress calculated for potential future use (e.g., progress bar on objective)
  const _progress = Math.min((objective.currentValue / objective.targetValue) * 100, 100);
  void _progress; // Prevent unused variable warning

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 rounded-lg bg-dark-800/50 p-2"
    >
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          objective.completed ? 'bg-green-500' : 'bg-dark-600'
        }`}
      >
        {objective.completed ? (
          <CheckCircleSolidIcon className="h-4 w-4 text-white" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-gray-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${objective.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}
        >
          {objective.description}
        </p>
      </div>
      <span className="text-xs text-gray-500">
        {objective.currentValue}/{objective.targetValue}
      </span>
    </motion.div>
  );
}
