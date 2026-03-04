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
import { motion, AnimatePresence } from 'motion/react';
import { createLogger } from '@/lib/logger';
import { ClipboardDocumentListIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useGamificationStore, type Quest } from '@/modules/gamification/store';
import { api } from '@/lib/api';
import LevelProgress from '@/modules/gamification/components/level-progress';
import type { QuestTab } from './types';
import { TABS } from './constants';
import QuestCard from './quest-card';
import { tweens, loop } from '@/lib/animation-presets';

const logger = createLogger('QuestsPage');

/**
 * Quests Page — route-level page component.
 */
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
  }, [fetchQuests]);

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
              transition={loop(tweens.slow)}
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
