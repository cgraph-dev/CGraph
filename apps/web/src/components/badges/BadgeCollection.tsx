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
import type { Achievement, AchievementCategory, AchievementRarity } from '@/stores/gamificationStore';

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

const RARITY_ORDER: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

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
          a.title.toLowerCase().includes(search) ||
          a.description.toLowerCase().includes(search)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'rarity':
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        case 'progress':
          const progA = a.maxProgress > 0 ? a.progress / a.maxProgress : 0;
          const progB = b.maxProgress > 0 ? b.progress / b.maxProgress : 0;
          return progB - progA;
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

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <p className="text-sm text-gray-400">
              {stats.unlocked} / {stats.total} unlocked ({stats.percentage}%)
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
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
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-lg',
                  'bg-dark-700/50 border border-white/10',
                  'text-white placeholder-gray-500',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
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
                'px-3 py-2 rounded-lg',
                'bg-dark-700/50 border border-white/10',
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
                'px-3 py-2 rounded-lg',
                'bg-dark-700/50 border border-white/10',
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
                'px-3 py-2 rounded-lg',
                'bg-dark-700/50 border border-white/10',
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
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
                achievement.unlocked && onEquipBadge
                  ? () => onEquipBadge(achievement)
                  : undefined
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <QuestionMarkCircleIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No achievements match your filters</p>
          <button
            className="text-primary-400 hover:text-primary-300 text-sm mt-2"
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
        'flex items-center gap-2 px-4 py-2 rounded-xl',
        'text-sm font-medium whitespace-nowrap',
        'transition-colors',
        isActive
          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
          : 'bg-dark-700/50 text-gray-400 border border-transparent hover:bg-dark-600/50 hover:text-white'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4" />
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
  const progress = achievement.maxProgress > 0
    ? (achievement.progress / achievement.maxProgress) * 100
    : 0;

  if (layout === 'list') {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-dark-800/50 border border-white/5',
          'hover:bg-dark-700/50 hover:border-white/10',
          'transition-all cursor-pointer'
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'font-semibold truncate',
              achievement.unlocked ? 'text-white' : 'text-gray-400'
            )}>
              {achievement.unlocked || !achievement.isHidden
                ? achievement.title
                : '???'}
            </h3>
            {isEquipped && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">
                Equipped
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {achievement.unlocked || !achievement.isHidden
              ? achievement.description
              : 'Hidden achievement'}
          </p>
          {!achievement.unlocked && achievement.maxProgress > 1 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
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
            className="text-xs font-medium uppercase px-2 py-1 rounded-lg"
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
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-primary-500/20 text-primary-400',
                'hover:bg-primary-500/30 transition-colors'
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
        'relative p-4 rounded-xl',
        'bg-dark-800/50 border border-white/5',
        'hover:bg-dark-700/50 hover:border-white/10',
        'transition-all cursor-pointer',
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
        <div className="absolute top-2 right-2">
          <CheckCircleIcon className="w-4 h-4 text-primary-400" />
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
      <h3 className={cn(
        'mt-3 font-semibold text-sm truncate w-full',
        achievement.unlocked ? 'text-white' : 'text-gray-400'
      )}>
        {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
      </h3>

      {/* Rarity */}
      <span
        className="mt-1 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: `${colors.primary}20`,
          color: colors.primary,
        }}
      >
        {achievement.rarity}
      </span>

      {/* Progress bar (if in progress) */}
      {!achievement.unlocked && achievement.maxProgress > 1 && progress > 0 && (
        <div className="w-full mt-2">
          <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-500 mt-0.5">
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
