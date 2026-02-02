/**
 * Quests Page
 *
 * Quest management with daily/weekly/special categories.
 * Allows accepting, tracking progress, and claiming rewards.
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('QuestsPage');
import {
  ClipboardDocumentListIcon,
  FireIcon,
  CalendarIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  GiftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore, type Quest, type QuestObjective } from '@/stores/gamificationStore';
import { api } from '@/lib/api';
import LevelProgress from '@/components/gamification/LevelProgress';

// ==================== TYPES ====================

type QuestTab = 'active' | 'daily' | 'weekly' | 'completed';

interface QuestCardProps {
  quest: Quest;
  onAccept?: () => void;
  onClaim?: () => void;
  isAccepting?: boolean;
  isClaiming?: boolean;
}

// ==================== CONSTANTS ====================

const TABS: { id: QuestTab; name: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'active',
    name: 'Active',
    icon: <ClipboardDocumentListIcon className="h-4 w-4" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'daily',
    name: 'Daily',
    icon: <FireIcon className="h-4 w-4" />,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    icon: <CalendarIcon className="h-4 w-4" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'completed',
    name: 'Completed',
    icon: <CheckCircleIcon className="h-4 w-4" />,
    color: 'from-green-500 to-emerald-500',
  },
];

// ==================== QUEST CARD ====================

function QuestCard({ quest, onAccept, onClaim, isAccepting, isClaiming }: QuestCardProps) {
  const allObjectivesComplete = quest.objectives.every((obj) => obj.completed);
  const canClaim = allObjectivesComplete && quest.completed;
  const timeLeft = quest.expiresAt ? getTimeLeft(quest.expiresAt) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <GlassCard
        variant={canClaim ? 'holographic' : 'default'}
        glow={canClaim}
        className={`p-5 ${canClaim ? 'ring-2 ring-green-500/50' : ''}`}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  quest.type === 'daily'
                    ? 'bg-orange-500/20 text-orange-400'
                    : quest.type === 'weekly'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {quest.type}
              </span>
              {timeLeft && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  {timeLeft}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">{quest.title}</h3>
            <p className="mt-1 text-sm text-gray-400">{quest.description}</p>
          </div>

          {/* Rewards Preview */}
          <div className="flex items-center gap-2">
            {quest.xpReward > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-purple-500/20 px-2 py-1">
                <SparklesIcon className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400">+{quest.xpReward}</span>
              </div>
            )}
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-4 space-y-3">
          {quest.objectives.map((objective, index) => (
            <ObjectiveItem key={objective.id || index} objective={objective} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onAccept && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onAccept();
                HapticFeedback.medium();
              }}
              disabled={isAccepting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isAccepting ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <ClipboardDocumentListIcon className="h-4 w-4" />
              )}
              Accept Quest
            </motion.button>
          )}

          {canClaim && onClaim && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClaim();
                HapticFeedback.success();
              }}
              disabled={isClaiming}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isClaiming ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <GiftIcon className="h-4 w-4" />
              )}
              Claim Rewards
            </motion.button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ObjectiveItem({ objective }: { objective: QuestObjective }) {
  const progress = Math.min((objective.currentValue / objective.targetValue) * 100, 100);

  return (
    <div className="relative">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {objective.completed ? (
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-600" />
          )}
          <span
            className={`text-sm ${objective.completed ? 'text-gray-400 line-through' : 'text-gray-300'}`}
          >
            {objective.description}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {objective.currentValue} / {objective.targetValue}
        </span>
      </div>
      <div className="ml-6 h-1 overflow-hidden rounded-full bg-dark-700">
        <motion.div
          className={`h-full ${objective.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-purple-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function getTimeLeft(expiresAt: string): string {
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

// ==================== MAIN COMPONENT ====================

export default function QuestsPage() {
  const { activeQuests, completedQuests, fetchQuests, completeQuest } = useGamificationStore();
  const [selectedTab, setSelectedTab] = useState<QuestTab>('active');
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Fetch quests
  useEffect(() => {
    let isMounted = true;

    const loadQuests = async () => {
      setIsLoading(true);
      try {
        await fetchQuests();

        // Also fetch available daily/weekly quests
        const [dailyRes, weeklyRes] = await Promise.all([
          api.get('/api/v1/quests/daily'),
          api.get('/api/v1/quests/weekly'),
        ]);

        if (isMounted) {
          setDailyQuests(dailyRes.data?.data || []);
          setWeeklyQuests(weeklyRes.data?.data || []);
        }
      } catch (error) {
        logger.error('Failed to fetch quests:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadQuests();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle accept quest
  const handleAcceptQuest = async (questId: string) => {
    setAcceptingId(questId);
    try {
      await api.post(`/api/v1/quests/${questId}/accept`);
      await fetchQuests();
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to accept quest:', error);
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async (questId: string) => {
    setClaimingId(questId);
    try {
      await completeQuest(questId);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to claim rewards:', error);
    } finally {
      setClaimingId(null);
    }
  };

  // Get quests for current tab
  const displayedQuests = useMemo(() => {
    switch (selectedTab) {
      case 'active':
        return activeQuests;
      case 'daily':
        return dailyQuests.filter((q) => !activeQuests.some((a) => a.id === q.id));
      case 'weekly':
        return weeklyQuests.filter((q) => !activeQuests.some((a) => a.id === q.id));
      case 'completed':
        return completedQuests;
      default:
        return [];
    }
  }, [selectedTab, activeQuests, dailyQuests, weeklyQuests, completedQuests]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-dark-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <ClipboardDocumentListIcon className="h-8 w-8 text-purple-400" />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
                  Quests
                </h1>
                <p className="text-sm text-gray-400">
                  {activeQuests.length} active • {completedQuests.length} completed
                </p>
              </div>
            </div>

            {/* Refresh button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                fetchQuests();
                HapticFeedback.light();
              }}
              className="rounded-xl bg-dark-800 p-2 text-gray-400 transition-colors hover:text-white"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Level Progress */}
        <div className="mb-6">
          <LevelProgress variant="expanded" showStreak />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedTab(tab.id);
                HapticFeedback.light();
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.name}
              {tab.id === 'active' && activeQuests.length > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {activeQuests.length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Quest List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : displayedQuests.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <ClipboardDocumentListIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-400">
              {selectedTab === 'active'
                ? 'No active quests'
                : selectedTab === 'completed'
                  ? 'No completed quests yet'
                  : 'No available quests'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedTab === 'active'
                ? 'Check the Daily or Weekly tabs to find new quests!'
                : 'Complete quests to earn XP and rewards'}
            </p>
          </GlassCard>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onAccept={
                    selectedTab !== 'active' && selectedTab !== 'completed'
                      ? () => handleAcceptQuest(quest.id)
                      : undefined
                  }
                  onClaim={
                    selectedTab === 'active' && quest.completed
                      ? () => handleClaimRewards(quest.id)
                      : undefined
                  }
                  isAccepting={acceptingId === quest.id}
                  isClaiming={claimingId === quest.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
