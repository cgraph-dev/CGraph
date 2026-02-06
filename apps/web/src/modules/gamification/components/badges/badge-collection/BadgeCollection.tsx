/**
 * BadgeCollection Component
 *
 * Displays all achievements organized by category with filtering and sorting.
 * Used in profile pages and achievement galleries.
 */

import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBadgeCollection } from './useBadgeCollection';
import { CollectionHeader } from './CollectionHeader';
import { FilterControls } from './FilterControls';
import { CategoryTabs } from './CategoryTabs';
import { AchievementCard } from './AchievementCard';
import { EmptyState } from './EmptyState';
import type { BadgeCollectionProps } from './types';

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
  const { filters, categoryCounts, filteredAchievements, stats, updateFilter, resetFilters } =
    useBadgeCollection(achievements);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header stats */}
      <CollectionHeader stats={stats} />

      {/* Search and filters */}
      <FilterControls
        filters={filters}
        showSearch={showSearch}
        showFilters={showFilters}
        onFilterUpdate={updateFilter}
      />

      {/* Category tabs */}
      <CategoryTabs
        selectedCategory={filters.category}
        categoryCounts={categoryCounts}
        onCategoryChange={(category) => updateFilter('category', category)}
      />

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
      {filteredAchievements.length === 0 && <EmptyState onClearFilters={resetFilters} />}
    </div>
  );
}

export default BadgeCollection;
