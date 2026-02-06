/**
 * AchievementDisplay Component
 *
 * Showcases user achievements with:
 * - Grid/list view modes
 * - Category filtering
 * - Rarity sorting
 * - Progress tracking for locked achievements
 * - Detailed achievement modal
 * - Statistics summary
 */

import { TrophyIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useAchievementDisplay } from './useAchievementDisplay';
import { StatsHeader } from './StatsHeader';
import { FilterBar } from './FilterBar';
import { AchievementCard } from './AchievementCard';
import { AchievementListItem } from './AchievementListItem';
import { AchievementModal } from './AchievementModal';
import type { AchievementDisplayProps } from './types';

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

  const {
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
    filteredAchievements,
    stats,
    handleClick,
    isUnlocked,
    getProgress,
  } = useAchievementDisplay(achievements, unlockedIds, showLocked, maxDisplay);

  const handleAchievementClick = (achievement: (typeof achievements)[0]) => {
    handleClick(achievement);
    onAchievementClick?.(achievement);
  };

  return (
    <div className={className}>
      {/* Stats Summary */}
      <StatsHeader stats={stats} />

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        showFilters={showFilters}
        primaryColor={primaryColor}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortBy}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Achievement Grid/List */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
              unlocked={isUnlocked(achievement)}
              progress={getProgress(achievement)}
              showProgress={showProgress}
              onClick={() => handleAchievementClick(achievement)}
            />
          ))}
        </div>
      ) : variant === 'list' ? (
        <GlassCard variant="frosted" className="overflow-hidden">
          {filteredAchievements.map((achievement, index) => (
            <AchievementListItem
              key={achievement.id}
              achievement={achievement}
              index={index}
              unlocked={isUnlocked(achievement)}
              progress={getProgress(achievement)}
              showProgress={showProgress}
              onClick={() => handleAchievementClick(achievement)}
            />
          ))}
        </GlassCard>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filteredAchievements.map((achievement, index) => (
            <div key={achievement.id} className="w-64 flex-shrink-0">
              <AchievementCard
                achievement={achievement}
                index={index}
                unlocked={isUnlocked(achievement)}
                progress={getProgress(achievement)}
                showProgress={showProgress}
                onClick={() => handleAchievementClick(achievement)}
              />
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
      <AchievementModal
        achievement={selectedAchievement}
        isUnlocked={selectedAchievement ? isUnlocked(selectedAchievement) : false}
        progress={selectedAchievement ? getProgress(selectedAchievement) : 0}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}

export default AchievementDisplay;
