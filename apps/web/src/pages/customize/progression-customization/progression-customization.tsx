/**
 * Progression system customization page.
 * @module
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGamificationStore } from '@/modules/gamification/store';
import { gamificationLogger as logger } from '@/lib/logger';
import { api } from '@/lib/api';
import {
  fetchAchievementsList,
  fetchLeaderboard,
  fetchQuestsList,
  fetchDailyRewards,
} from '@/modules/gamification/store/gamification-queries';
import type { ProgressionCategory, Achievement, LeaderboardEntry, Quest, DailyReward } from './types';
import { getCategoryConfigs } from './categories';
import { StatsOverview } from './stats-overview';
import { AchievementsSection } from './achievements-section';
import { LeaderboardsSection } from './leaderboards-section';
import { QuestsSection } from './quests-section';
import { DailyRewardsSection } from './daily-rewards-section';
import { tweens } from '@/lib/animation-presets';

/**
 * ProgressionCustomization Component
 *
 * Unified gamification hub with 4 sections:
 * 1. Achievements - All unlocked/locked achievements with progress
 * 2. Leaderboards - Global/Friends/Weekly leaderboards
 * 3. Quests - Daily/Weekly/Special quests with rewards
 * 4. Daily Rewards - Streak tracker and reward calendar
 *
 * This replaces the old /gamification routes and consolidates all
 * progression features into the Customize hub.
 *
 * NOTE: This page uses real data from useGamificationStore (level, xp, karma).
 * Achievements, leaderboards, and quests are currently using mock data
 * until the backend APIs are implemented. These will be replaced with
 * real API calls in Phase 3+.
 */
export function ProgressionCustomization() {
  const { level, xp, karma: _karma } = useGamificationStore();
  void _karma; // Reserved for future use
  const [activeCategory, setActiveCategory] = useState<ProgressionCategory>('achievements');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'friends' | 'weekly'>('global');
  const [searchQuery, setSearchQuery] = useState('');

  // API data state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch all progression data on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingData(true);
    Promise.all([
      fetchAchievementsList(),
      fetchLeaderboard(),
      fetchQuestsList(),
      fetchDailyRewards(),
    ])
      .then(([achData, lbData, questData, rewardData]) => {
        if (cancelled) return;
        setAchievements(achData);
        setLeaderboard(lbData);
        setQuests(questData);
        setDailyRewards(rewardData);
      })
      .catch((error) => {
        logger.error('Failed to load progression data:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingData(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Refetch leaderboard when type changes
  useEffect(() => {
    fetchLeaderboard(leaderboardType).then(setLeaderboard).catch(() => {});
  }, [leaderboardType]);

  const categories = getCategoryConfigs(achievements.length, leaderboard.length, quests.filter((q) => !q.completed).length);

  // Calculate current streak
  const currentStreak = dailyRewards.filter((r) => r.claimed).length;

  // Handle claiming daily reward
  const handleClaimReward = async (day: number) => {
    try {
      await api.post('/api/v1/gamification/streak/claim', { day });
      logger.log(`Claimed reward for day ${day}`);
      // Refresh daily rewards after claiming
      const updated = await fetchDailyRewards();
      setDailyRewards(updated);
    } catch (error) {
      logger.error('Failed to claim daily reward:', error);
    }
  };

  // Filter achievements by search
  const filteredAchievements = achievements.filter(
    (ach) =>
      ach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ach.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsOverview level={level} xp={xp} currentStreak={currentStreak} />

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {category.label}
              {category.id !== 'rewards' && (
                <span className="text-xs opacity-60">({category.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar (for achievements only) */}
      {activeCategory === 'achievements' && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={tweens.fast}
        >
          {activeCategory === 'achievements' && (
            <AchievementsSection achievements={filteredAchievements} />
          )}

          {activeCategory === 'leaderboards' && (
            <LeaderboardsSection
              entries={leaderboard}
              leaderboardType={leaderboardType}
              onTypeChange={setLeaderboardType}
            />
          )}

          {activeCategory === 'quests' && <QuestsSection quests={quests} />}

          {activeCategory === 'rewards' && (
            <DailyRewardsSection
              rewards={dailyRewards}
              currentStreak={currentStreak}
              onClaim={handleClaimReward}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ProgressionCustomization;
