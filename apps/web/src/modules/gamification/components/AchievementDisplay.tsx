import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  StarIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SparklesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

// Reserved for future features
const _reservedIcons = { StarIcon };
void _reservedIcons;

import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '@/modules/gamification/store/types';

/**
 * AchievementDisplay Component
 *
 * Showcases user achievements with:
 * - Grid/list view modes
 * - Category filtering
 * - Rarity sorting
 * - Progress tracking for locked achievements
 * - Detailed achievement modal
 * - Animated unlock celebrations
 * - Statistics summary
 */

interface AchievementDisplayProps {
  achievements: Achievement[];
  unlockedIds?: string[];
  onAchievementClick?: (achievement: Achievement) => void;
  variant?: 'grid' | 'list' | 'compact';
  showLocked?: boolean;
  showProgress?: boolean;
  maxDisplay?: number;
  className?: string;
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_GRADIENTS: Record<AchievementRarity, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-500 to-orange-600',
};

const CATEGORY_ICONS: Record<AchievementCategory, React.ReactNode> = {
  social: <span>👥</span>,
  messaging: <span>💬</span>,
  groups: <span>🏘️</span>,
  forums: <span>📝</span>,
  gaming: <span>🎮</span>,
  special: <span>⭐</span>,
  seasonal: <span>🎉</span>,
};

export function AchievementDisplay({
  achievements,
  unlockedIds = [],
  onAchievementClick,
  variant = 'grid',
  showLocked = true,
  showProgress = true,
  maxDisplay,
  className = '',
}: AchievementDisplayProps) {
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'recent' | 'progress'>('rarity');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievements];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
      );
    }

    // Filter locked if needed
    if (!showLocked) {
      filtered = filtered.filter((a) => a.unlockedAt || unlockedSet.has(a.id));
    }

    // Sort
    const rarityOrder: Record<AchievementRarity, number> = {
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };

    switch (sortBy) {
      case 'rarity':
        filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          if (!a.unlockedAt && !b.unlockedAt) return 0;
          if (!a.unlockedAt) return 1;
          if (!b.unlockedAt) return -1;
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        });
        break;
      case 'progress':
        filtered.sort((a, b) => {
          const progressA = a.targetProgress ? (a.currentProgress || 0) / a.targetProgress : 0;
          const progressB = b.targetProgress ? (b.currentProgress || 0) / b.targetProgress : 0;
          return progressB - progressA;
        });
        break;
    }

    return maxDisplay ? filtered.slice(0, maxDisplay) : filtered;
  }, [achievements, selectedCategory, searchQuery, showLocked, sortBy, unlockedSet, maxDisplay]);

  // Stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlockedAt || unlockedSet.has(a.id)).length;
    const byRarity: Record<AchievementRarity, { total: number; unlocked: number }> = {
      common: { total: 0, unlocked: 0 },
      uncommon: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 },
    };

    achievements.forEach((a) => {
      byRarity[a.rarity].total++;
      if (a.unlockedAt || unlockedSet.has(a.id)) {
        byRarity[a.rarity].unlocked++;
      }
    });

    return { total, unlocked, byRarity };
  }, [achievements, unlockedSet]);

  const handleClick = (achievement: Achievement) => {
    HapticFeedback.light();
    setSelectedAchievement(achievement);
    onAchievementClick?.(achievement);
  };

  const isUnlocked = (achievement: Achievement) =>
    achievement.unlockedAt || unlockedSet.has(achievement.id);

  const getProgress = (achievement: Achievement) => {
    if (!achievement.targetProgress) return 100;
    return Math.min(((achievement.currentProgress || 0) / achievement.targetProgress) * 100, 100);
  };

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const unlocked = isUnlocked(achievement);
    const progress = getProgress(achievement);

    return (
      <motion.div
        key={achievement.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02, y: -5 }}
        onClick={() => handleClick(achievement)}
        className="cursor-pointer"
      >
        <GlassCard
          variant={unlocked ? 'neon' : 'frosted'}
          className={`relative overflow-hidden transition-all ${
            unlocked ? '' : 'opacity-70 grayscale-[50%]'
          }`}
        >
          {/* Rarity glow */}
          {unlocked && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${RARITY_GRADIENTS[achievement.rarity]} opacity-10`}
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="relative p-4">
            {/* Icon */}
            <div className="mb-3 flex items-start justify-between">
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                }}
              >
                {achievement.iconUrl ? (
                  <img
                    src={achievement.iconUrl}
                    alt={achievement.name}
                    className={`h-10 w-10 ${!unlocked ? 'grayscale' : ''}`}
                  />
                ) : (
                  <TrophyIcon
                    className="h-8 w-8"
                    style={{ color: RARITY_COLORS[achievement.rarity] }}
                  />
                )}
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-dark-900/50">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Rarity Badge */}
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                style={{
                  backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                  color: RARITY_COLORS[achievement.rarity],
                }}
              >
                {achievement.rarity}
              </span>
            </div>

            {/* Info */}
            <h4 className="mb-1 font-semibold">{achievement.name}</h4>
            <p className="mb-3 line-clamp-2 text-sm text-gray-400">{achievement.description}</p>

            {/* Progress Bar */}
            {showProgress && !unlocked && achievement.targetProgress && (
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span style={{ color: RARITY_COLORS[achievement.rarity] }}>
                    {achievement.currentProgress || 0}/{achievement.targetProgress}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Rewards */}
            <div className="flex items-center gap-3 text-sm">
              {achievement.xpReward > 0 && (
                <span className="flex items-center gap-1 text-purple-400">
                  <SparklesIcon className="h-4 w-4" />
                  {achievement.xpReward} XP
                </span>
              )}
              {achievement.coinReward > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span>🪙</span>
                  {achievement.coinReward}
                </span>
              )}
            </div>

            {/* Unlocked checkmark */}
            {unlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-3"
              >
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </motion.div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  const renderListItem = (achievement: Achievement, index: number) => {
    const unlocked = isUnlocked(achievement);
    const progress = getProgress(achievement);

    return (
      <motion.div
        key={achievement.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={() => handleClick(achievement)}
        className={`flex cursor-pointer items-center gap-4 border-b border-dark-700 p-4 transition-colors hover:bg-dark-700/50 ${
          !unlocked ? 'opacity-70' : ''
        }`}
      >
        {/* Icon */}
        <div
          className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${RARITY_COLORS[achievement.rarity]}20` }}
        >
          {achievement.iconUrl ? (
            <img
              src={achievement.iconUrl}
              alt={achievement.name}
              className={`h-8 w-8 ${!unlocked ? 'grayscale' : ''}`}
            />
          ) : (
            <TrophyIcon className="h-6 w-6" style={{ color: RARITY_COLORS[achievement.rarity] }} />
          )}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-dark-900/50">
              <LockClosedIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-medium">{achievement.name}</h4>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                color: RARITY_COLORS[achievement.rarity],
              }}
            >
              {achievement.rarity}
            </span>
          </div>
          <p className="truncate text-sm text-gray-400">{achievement.description}</p>
        </div>

        {/* Progress / Status */}
        <div className="flex items-center gap-3">
          {!unlocked && showProgress && achievement.targetProgress && (
            <div className="text-right">
              <div className="text-sm font-medium">{Math.round(progress)}%</div>
              <div className="text-xs text-gray-400">
                {achievement.currentProgress || 0}/{achievement.targetProgress}
              </div>
            </div>
          )}
          {unlocked && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={className}>
      {/* Stats Summary */}
      <GlassCard variant="frosted" className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="mb-1 text-lg font-semibold">Achievements</h3>
            <p className="text-sm text-gray-400">
              {stats.unlocked} of {stats.total} unlocked
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as AchievementRarity[]).map(
              (rarity) => (
                <div
                  key={rarity}
                  className="flex items-center gap-1"
                  title={`${rarity}: ${stats.byRarity[rarity].unlocked}/${stats.byRarity[rarity].total}`}
                >
                  <StarIconSolid className="h-4 w-4" style={{ color: RARITY_COLORS[rarity] }} />
                  <span className="text-sm">
                    {stats.byRarity[rarity].unlocked}/{stats.byRarity[rarity].total}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements..."
            className="w-full rounded-lg bg-dark-700 py-2 pl-10 pr-4 outline-none focus:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 hover:bg-dark-600"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="capitalize">{selectedCategory}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
              >
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setShowFilters(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-dark-600 ${selectedCategory === 'all' ? 'text-white' : 'text-gray-400'}`}
                >
                  All Categories
                </button>
                {(
                  [
                    'social',
                    'messaging',
                    'groups',
                    'forums',
                    'gaming',
                    'special',
                    'seasonal',
                  ] as AchievementCategory[]
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowFilters(false);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left capitalize hover:bg-dark-600 ${selectedCategory === cat ? 'text-white' : 'text-gray-400'}`}
                  >
                    {CATEGORY_ICONS[cat]}
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg bg-dark-700 px-4 py-2 outline-none"
        >
          <option value="rarity">By Rarity</option>
          <option value="recent">Recently Unlocked</option>
          <option value="progress">By Progress</option>
        </select>
      </div>

      {/* Achievement Grid/List */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAchievements.map((achievement, index) =>
            renderAchievementCard(achievement, index)
          )}
        </div>
      ) : variant === 'list' ? (
        <GlassCard variant="frosted" className="overflow-hidden">
          {filteredAchievements.map((achievement, index) => renderListItem(achievement, index))}
        </GlassCard>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filteredAchievements.map((achievement, index) => (
            <div key={achievement.id} className="w-64 flex-shrink-0">
              {renderAchievementCard(achievement, index)}
            </div>
          ))}
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <GlassCard variant="frosted" className="p-8 text-center">
          <TrophyIcon className="mx-auto mb-3 h-12 w-12 text-gray-500" />
          <p className="text-gray-400">No achievements found</p>
        </GlassCard>
      )}

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard variant="neon" className="p-6">
                <div className="text-center">
                  <div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${RARITY_COLORS[selectedAchievement.rarity]}20`,
                    }}
                  >
                    {selectedAchievement.iconUrl ? (
                      <img
                        src={selectedAchievement.iconUrl}
                        alt={selectedAchievement.name}
                        className="h-14 w-14"
                      />
                    ) : (
                      <TrophyIconSolid
                        className="h-12 w-12"
                        style={{ color: RARITY_COLORS[selectedAchievement.rarity] }}
                      />
                    )}
                  </div>

                  <span
                    className="mb-3 inline-block rounded-full px-3 py-1 text-sm font-medium capitalize"
                    style={{
                      backgroundColor: `${RARITY_COLORS[selectedAchievement.rarity]}20`,
                      color: RARITY_COLORS[selectedAchievement.rarity],
                    }}
                  >
                    {selectedAchievement.rarity}
                  </span>

                  <h3 className="mb-2 text-xl font-bold">{selectedAchievement.name}</h3>
                  <p className="mb-4 text-gray-400">{selectedAchievement.description}</p>

                  {/* Progress */}
                  {selectedAchievement.targetProgress && !isUnlocked(selectedAchievement) && (
                    <div className="mb-4">
                      <div className="h-3 overflow-hidden rounded-full bg-dark-700">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: RARITY_COLORS[selectedAchievement.rarity] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgress(selectedAchievement)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-400">
                        {selectedAchievement.currentProgress || 0} /{' '}
                        {selectedAchievement.targetProgress}
                      </p>
                    </div>
                  )}

                  {/* Rewards */}
                  <div className="flex items-center justify-center gap-6">
                    {selectedAchievement.xpReward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          +{selectedAchievement.xpReward}
                        </div>
                        <div className="text-sm text-gray-400">XP</div>
                      </div>
                    )}
                    {selectedAchievement.coinReward > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">
                          +{selectedAchievement.coinReward}
                        </div>
                        <div className="text-sm text-gray-400">Coins</div>
                      </div>
                    )}
                  </div>

                  {isUnlocked(selectedAchievement) && selectedAchievement.unlockedAt && (
                    <p className="mt-4 text-sm text-gray-500">
                      Unlocked on {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AchievementDisplay;
