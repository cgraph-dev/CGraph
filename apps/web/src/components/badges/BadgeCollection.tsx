/**
 * BadgeCollection Component
 *
 * Displays all achievements organized by category with filtering and sorting.
 * Used in profile pages and achievement galleries.
 *
 * Features:
 * - Category tabs with counts
 * - Rarity filtering
 * - Progress tracking
 * - Lock/unlock visual states
 * - Search functionality
 *
 * @version 1.0.0
 * @since 2026-01-18
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  SparklesIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip, RARITY_COLORS } from './AnimatedBadge';
import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '@/stores/gamificationStore';

// ==================== TYPE DEFINITIONS ====================

export interface BadgeCollectionProps {
  /** All achievements */
  achievements: Achievement[];
  /** Callback when achievement is clicked */
  onAchievementClick?: (achievement: Achievement) => void;
  /** Callback to equip a badge */
  onEquipBadge?: (achievement: Achievement) => void;
  /** Currently equipped badge IDs */
  equippedBadgeIds?: string[];
  /** Show search bar */
  showSearch?: boolean;
  /** Show filters */
  showFilters?: boolean;
  /** Layout mode */
  layout?: 'grid' | 'list';
  /** Additional className */
  className?: string;
}

// ==================== CATEGORY ICONS ====================

const CATEGORY_ICONS: Record<AchievementCategory, React.ComponentType<{ className?: string }>> = {
  social: ChatBubbleLeftRightIcon,
  content: DocumentTextIcon,
  exploration: GlobeAltIcon,
  mastery: AcademicCapIcon,
  legendary: TrophyIcon,
  secret: QuestionMarkCircleIcon,
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  social: 'Social',
  content: 'Content',
  exploration: 'Exploration',
  mastery: 'Mastery',
  legendary: 'Legendary',
  secret: 'Secret',
};

// ==================== RARITY BADGES ====================

const RARITY_ORDER: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

// ==================== FILTER STATE ====================

type SortOption = 'name' | 'rarity' | 'progress' | 'unlocked';

interface FilterState {
  category: AchievementCategory | 'all';
  rarity: AchievementRarity | 'all';
  status: 'all' | 'unlocked' | 'locked' | 'in-progress';
  sort: SortOption;
  search: string;
}

// ==================== MAIN COMPONENT ====================

export function BadgeCollection({
  achievements,
  onAchievementClick,
  onEquipBadge,
  equippedBadgeIds = [],
  showSearch = true,
  showFilters = true,
  layout = 'grid',
  className,
}: BadgeCollectionProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    rarity: 'all',
    status: 'all',
    sort: 'rarity',
    search: '',
  });

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; unlocked: number }> = {
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
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    return { total, unlocked, percentage };
  }, [achievements]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-6 w-6 text-amber-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <p className="text-sm text-gray-400">
              {stats.unlocked} / {stats.total} unlocked ({stats.percentage}%)
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-32 overflow-hidden rounded-full bg-dark-700">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
            initial={{ width: 0 }}
            animate={{ width: `${stats.percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Search and filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="relative min-w-[200px] flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={cn(
                  'w-full rounded-lg py-2 pl-9 pr-4',
                  'border border-white/10 bg-dark-700/50',
                  'text-white placeholder-gray-500',
                  'focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                  'transition-all'
                )}
              />
            </div>
          )}

          {/* Rarity filter */}
          {showFilters && (
            <select
              value={filters.rarity}
              onChange={(e) => updateFilter('rarity', e.target.value as AchievementRarity | 'all')}
              className={cn(
                'rounded-lg px-3 py-2',
                'border border-white/10 bg-dark-700/50',
                'text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                'cursor-pointer'
              )}
            >
              <option value="all">All Rarities</option>
              {RARITY_ORDER.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </select>
          )}

          {/* Status filter */}
          {showFilters && (
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value as FilterState['status'])}
              className={cn(
                'rounded-lg px-3 py-2',
                'border border-white/10 bg-dark-700/50',
                'text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                'cursor-pointer'
              )}
            >
              <option value="all">All Status</option>
              <option value="unlocked">Unlocked</option>
              <option value="in-progress">In Progress</option>
              <option value="locked">Locked</option>
            </select>
          )}

          {/* Sort */}
          {showFilters && (
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as SortOption)}
              className={cn(
                'rounded-lg px-3 py-2',
                'border border-white/10 bg-dark-700/50',
                'text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                'cursor-pointer'
              )}
            >
              <option value="rarity">Sort by Rarity</option>
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="unlocked">Sort by Status</option>
            </select>
          )}
        </div>
      )}

      {/* Category tabs */}
      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
        <CategoryTab
          label="All"
          icon={SparklesIcon}
          isActive={filters.category === 'all'}
          count={categoryCounts.all || { total: 0, unlocked: 0 }}
          onClick={() => updateFilter('category', 'all')}
        />
        {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((category) => {
          const count = categoryCounts[category] || { total: 0, unlocked: 0 };
          if (count.total === 0) return null;
          return (
            <CategoryTab
              key={category}
              label={CATEGORY_LABELS[category]}
              icon={CATEGORY_ICONS[category]}
              isActive={filters.category === category}
              count={count}
              onClick={() => updateFilter('category', category)}
            />
          );
        })}
      </div>

      {/* Achievement grid/list */}
      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            : 'space-y-3'
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              layout={layout}
              index={index}
              isEquipped={equippedBadgeIds.includes(achievement.id)}
              onClick={() => onAchievementClick?.(achievement)}
              onEquip={
                achievement.unlocked && onEquipBadge ? () => onEquipBadge(achievement) : undefined
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <motion.div className="py-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <QuestionMarkCircleIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No achievements match your filters</p>
          <button
            className="mt-2 text-sm text-primary-400 hover:text-primary-300"
            onClick={() =>
              setFilters({
                category: 'all',
                rarity: 'all',
                status: 'all',
                sort: 'rarity',
                search: '',
              })
            }
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ==================== CATEGORY TAB ====================

interface CategoryTabProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  count: { total: number; unlocked: number };
  onClick: () => void;
}

function CategoryTab({ label, icon: Icon, isActive, count, onClick }: CategoryTabProps) {
  return (
    <motion.button
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2',
        'whitespace-nowrap text-sm font-medium',
        'transition-colors',
        isActive
          ? 'border border-primary-500/30 bg-primary-500/20 text-primary-400'
          : 'border border-transparent bg-dark-700/50 text-gray-400 hover:bg-dark-600/50 hover:text-white'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span className="text-xs opacity-60">
        {count.unlocked}/{count.total}
      </span>
    </motion.button>
  );
}

// ==================== ACHIEVEMENT CARD ====================

interface AchievementCardProps {
  achievement: Achievement;
  layout: 'grid' | 'list';
  index: number;
  isEquipped: boolean;
  onClick?: () => void;
  onEquip?: () => void;
}

function AchievementCard({
  achievement,
  layout,
  index,
  isEquipped,
  onClick,
  onEquip,
}: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity];
  const progress =
    achievement.maxProgress > 0 ? (achievement.progress / achievement.maxProgress) * 100 : 0;

  if (layout === 'list') {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-4 rounded-xl p-4',
          'border border-white/5 bg-dark-800/50',
          'hover:border-white/10 hover:bg-dark-700/50',
          'cursor-pointer transition-all'
        )}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.03 }}
        onClick={onClick}
      >
        <AnimatedBadgeWithTooltip
          achievement={achievement}
          size="md"
          animated={achievement.unlocked}
          showProgress
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'truncate font-semibold',
                achievement.unlocked ? 'text-white' : 'text-gray-400'
              )}
            >
              {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
            </h3>
            {isEquipped && (
              <span className="rounded bg-primary-500/20 px-1.5 py-0.5 text-xs text-primary-400">
                Equipped
              </span>
            )}
          </div>
          <p className="truncate text-sm text-gray-500">
            {achievement.unlocked || !achievement.isHidden
              ? achievement.description
              : 'Hidden achievement'}
          </p>
          {!achievement.unlocked && achievement.maxProgress > 1 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-600">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className="rounded-lg px-2 py-1 text-xs font-medium uppercase"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            {achievement.rarity}
          </span>
          <span className="text-sm text-gray-400">+{achievement.xpReward} XP</span>
          {achievement.unlocked && onEquip && !isEquipped && (
            <motion.button
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                'bg-primary-500/20 text-primary-400',
                'transition-colors hover:bg-primary-500/30'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onEquip();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Equip
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid layout
  return (
    <motion.div
      className={cn(
        'relative rounded-xl p-4',
        'border border-white/5 bg-dark-800/50',
        'hover:border-white/10 hover:bg-dark-700/50',
        'cursor-pointer transition-all',
        'flex flex-col items-center text-center'
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute right-2 top-2">
          <CheckCircleIcon className="h-4 w-4 text-primary-400" />
        </div>
      )}

      {/* Badge */}
      <AnimatedBadgeWithTooltip
        achievement={achievement}
        size="lg"
        animated={achievement.unlocked}
        showProgress
      />

      {/* Title */}
      <h3
        className={cn(
          'mt-3 w-full truncate text-sm font-semibold',
          achievement.unlocked ? 'text-white' : 'text-gray-400'
        )}
      >
        {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
      </h3>

      {/* Rarity */}
      <span
        className="mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
        style={{
          backgroundColor: `${colors.primary}20`,
          color: colors.primary,
        }}
      >
        {achievement.rarity}
      </span>

      {/* Progress bar (if in progress) */}
      {!achievement.unlocked && achievement.maxProgress > 1 && progress > 0 && (
        <div className="mt-2 w-full">
          <div className="h-1 overflow-hidden rounded-full bg-dark-600">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />
          </div>
          <span className="mt-0.5 text-[10px] text-gray-500">
            {achievement.progress}/{achievement.maxProgress}
          </span>
        </div>
      )}

      {/* XP reward */}
      <span className="mt-1 text-xs text-gray-500">+{achievement.xpReward} XP</span>
    </motion.div>
  );
}

export default BadgeCollection;
