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
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Quest } from '@/stores/gamificationStore';
import { getQuestTypeColor, getQuestProgress, isQuestReady } from './utils';
import { QuestObjectiveItem } from './QuestObjectiveItem';

interface FullQuestPanelProps {
  className: string;
  displayedQuests: Quest[];
  activeQuests: Quest[];
  completedToday: number;
  maxQuests: number;
  isLoading: boolean;
  claimingQuestId: string | null;
  expandedQuest: string | null;
  timeRemaining: Record<string, string>;
  onExpandQuest: (questId: string | null) => void;
  onClaimReward: (quest: Quest) => void;
  onRefresh: () => void;
}

export function FullQuestPanel({
  className,
  displayedQuests,
  activeQuests,
  completedToday,
  maxQuests,
  isLoading,
  claimingQuestId,
  expandedQuest,
  timeRemaining,
  onExpandQuest,
  onClaimReward,
  onRefresh,
}: FullQuestPanelProps) {
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
                onRefresh();
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
                      onClick={() => onExpandQuest(isExpanded ? null : quest.id)}
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
                                onClaimReward(quest);
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
