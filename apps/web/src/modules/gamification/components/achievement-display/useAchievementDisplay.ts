/**
 * useAchievementDisplay hook - state and logic for achievement display
 */

import { useState, useMemo } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { RARITY_ORDER } from './constants';
import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  AchievementStats,
  SortOption,
} from './types';

export function useAchievementDisplay(
  achievements: Achievement[],
  unlockedIds: string[],
  showLocked: boolean,
  maxDisplay?: number
) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rarity');
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
    switch (sortBy) {
      case 'rarity':
        filtered.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
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

  // Stats calculation
  const stats = useMemo<AchievementStats>(() => {
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
  };

  const isUnlocked = (achievement: Achievement) =>
    achievement.unlockedAt || unlockedSet.has(achievement.id);

  const getProgress = (achievement: Achievement) => {
    if (!achievement.targetProgress) return 100;
    return Math.min(((achievement.currentProgress || 0) / achievement.targetProgress) * 100, 100);
  };

  return {
    // State
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    selectedAchievement,
    setSelectedAchievement,
    showFilters,
    setShowFilters,
    // Computed
    filteredAchievements,
    stats,
    // Helpers
    handleClick,
    isUnlocked,
    getProgress,
  };
}
