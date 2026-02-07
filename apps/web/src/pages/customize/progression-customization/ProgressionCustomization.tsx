import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/modules/gamification/store';
import { gamificationLogger as logger } from '@/lib/logger';
import type { ProgressionCategory } from './types';
import { MOCK_ACHIEVEMENTS, MOCK_LEADERBOARD, MOCK_QUESTS, MOCK_DAILY_REWARDS } from './mock-data';
import { getCategoryConfigs } from './categories';
import { StatsOverview } from './StatsOverview';
import { AchievementsSection } from './AchievementsSection';
import { LeaderboardsSection } from './LeaderboardsSection';
import { QuestsSection } from './QuestsSection';
import { DailyRewardsSection } from './DailyRewardsSection';

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

  const categories = getCategoryConfigs();

  // Calculate current streak
  const currentStreak = MOCK_DAILY_REWARDS.filter((r) => r.claimed).length;

  // Handle claiming daily reward
  const handleClaimReward = (day: number) => {
    // @todo(api) Implement claim daily reward endpoint
    logger.log(`Claiming reward for day ${day}`);
    // In production, this would:
    // 1. Call API to claim the reward
    // 2. Update local state to mark the reward as claimed
    // 3. Show a success toast
    // For now, just log the claim
  };

  // Filter achievements by search
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter(
    (ach) =>
      ach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ach.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          transition={{ duration: 0.2 }}
        >
          {activeCategory === 'achievements' && (
            <AchievementsSection achievements={filteredAchievements} />
          )}

          {activeCategory === 'leaderboards' && (
            <LeaderboardsSection
              entries={MOCK_LEADERBOARD}
              leaderboardType={leaderboardType}
              onTypeChange={setLeaderboardType}
            />
          )}

          {activeCategory === 'quests' && <QuestsSection quests={MOCK_QUESTS} />}

          {activeCategory === 'rewards' && (
            <DailyRewardsSection
              rewards={MOCK_DAILY_REWARDS}
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
