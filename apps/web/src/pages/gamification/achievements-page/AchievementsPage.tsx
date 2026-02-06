/**
 * Achievements Page
 *
 * Full achievements browser with category filtering, progress tracking,
 * and unlock celebrations. Connects to gamificationStore for real-time data.
 *
 * Modularized into achievements-page/ directory:
 * - types.ts: Type definitions
 * - constants.tsx: Categories, rarity colors, rarity order
 * - AchievementCard.tsx: Individual achievement card component
 * - AchievementDetailModal.tsx: Modal for achievement details
 * - useAchievementStats.ts: Hook for computing achievement statistics
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  useGamificationStore,
  type AchievementCategory,
  type AchievementRarity,
  type Achievement,
} from '@/stores/gamificationStore';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';
import LevelProgress from '@/modules/gamification/components/LevelProgress';

import { CATEGORIES, RARITY_COLORS, RARITY_ORDER } from './constants';
import { AchievementCard } from './AchievementCard';
import { AchievementDetailModal } from './AchievementDetailModal';
import { useAchievementStats } from './useAchievementStats';

export default function AchievementsPage() {
  const { achievements, fetchAchievements, isLoadingAchievements } = useGamificationStore();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Fetch achievements on mount
  useEffect(() => {
    fetchAchievements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge store achievements with definitions for complete data
  const mergedAchievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const storeAchievement = achievements.find((a) => a.id === def.id);
      return {
        ...def,
        progress: storeAchievement?.progress || 0,
        unlocked: storeAchievement?.unlocked || false,
        unlockedAt: storeAchievement?.unlockedAt,
      } as Achievement;
    });
  }, [achievements]);

  // Use extracted hook for stats
  const stats = useAchievementStats(mergedAchievements);

  // Filter and search
  const filteredAchievements = useMemo(() => {
    return mergedAchievements.filter((achievement) => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;

      // Rarity filter
      if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) return false;

      // Unlocked filter
      if (showUnlockedOnly && !achievement.unlocked) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = achievement.title.toLowerCase().includes(query);
        const matchesDesc = achievement.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [mergedAchievements, selectedCategory, selectedRarity, showUnlockedOnly, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-dark-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrophyIcon className="h-8 w-8 text-yellow-400" />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-2xl font-bold text-transparent">
                  Achievements
                </h1>
                <p className="text-sm text-gray-400">
                  {stats?.unlocked ?? 0} / {stats?.total ?? 0} unlocked •{' '}
                  {(stats?.totalXPEarned ?? 0).toLocaleString()} XP earned
                </p>
              </div>
            </div>

            {/* Level Progress Mini */}
            <div className="hidden w-64 md:block">
              <LevelProgress variant="compact" showStreak={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          {RARITY_ORDER.map((rarity) => {
            const data = stats.byRarity[rarity];
            const colors = RARITY_COLORS[rarity];
            return (
              <motion.button
                key={rarity}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRarity(selectedRarity === rarity ? 'all' : rarity);
                  HapticFeedback.light();
                }}
                className={`rounded-xl p-3 transition-all ${colors.bg} border ${selectedRarity === rarity ? colors.border : 'border-transparent'}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                  {rarity}
                </p>
                <p className="text-lg font-bold text-white">
                  {data.unlocked}/{data.total}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory(category.id);
                  HapticFeedback.light();
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                {category.icon}
                {category.name}
              </motion.button>
            ))}
          </div>

          {/* Toggle unlocked only */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowUnlockedOnly(!showUnlockedOnly);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              showUnlockedOnly
                ? 'border border-green-500/40 bg-green-500/20 text-green-400'
                : 'bg-dark-800 text-gray-400'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Unlocked
          </motion.button>
        </div>

        {/* Achievement Grid */}
        {isLoadingAchievements ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <TrophyIcon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-400">No achievements found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
          </GlassCard>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
