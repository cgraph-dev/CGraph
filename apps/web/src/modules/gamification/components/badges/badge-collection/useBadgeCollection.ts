/**
 * useBadgeCollection hook - state and logic for badge collection
 */

import { useState, useMemo, useCallback } from 'react';
import { RARITY_ORDER, INITIAL_FILTER_STATE } from './constants';
import type { Achievement, FilterState, CategoryCount, CollectionStats } from './types';

export function useBadgeCollection(achievements: Achievement[]) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, CategoryCount> = {
      all: { total: 0, unlocked: 0 },
    };

    achievements.forEach((a) => {
      const allCount = counts.all;
      if (allCount) {
        allCount.total++;
        if (a.unlocked) allCount.unlocked++;
      }

      if (!counts[a.category]) {
        counts[a.category] = { total: 0, unlocked: 0 };
      }
      const catCount = counts[a.category];
      if (catCount) {
        catCount.total++;
        if (a.unlocked) catCount.unlocked++;
      }
    });

    return counts;
  }, [achievements]);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let result = [...achievements];

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter((a) => a.category === filters.category);
    }

    // Rarity filter
    if (filters.rarity !== 'all') {
      result = result.filter((a) => a.rarity === filters.rarity);
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'unlocked') {
        result = result.filter((a) => a.unlocked);
      } else if (filters.status === 'locked') {
        result = result.filter((a) => !a.unlocked && a.progress === 0);
      } else if (filters.status === 'in-progress') {
        result = result.filter((a) => !a.unlocked && a.progress > 0);
      }
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(search) || a.description.toLowerCase().includes(search)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'rarity':
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        case 'progress': {
          const progA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
          const progB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
          return progB - progA;
        }
        case 'unlocked':
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
          return 0;
        default:
          return 0;
      }
    });

    return result;
  }, [achievements, filters]);

  // Completion stats
  const stats = useMemo<CollectionStats>(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }, [achievements]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  return {
    filters,
    categoryCounts,
    filteredAchievements,
    stats,
    updateFilter,
    resetFilters,
  };
}
