/**
 * CategoryTabs - category filter tabs with counts
 */

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_LABELS } from './constants';
import type { AchievementCategory, CategoryCount } from './types';

interface CategoryTabsProps {
  selectedCategory: AchievementCategory | 'all';
  categoryCounts: Record<string, CategoryCount>;
  onCategoryChange: (category: AchievementCategory | 'all') => void;
}

export function CategoryTabs({
  selectedCategory,
  categoryCounts,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
      <CategoryTab
        label="All"
        icon={SparklesIcon}
        isActive={selectedCategory === 'all'}
        count={categoryCounts.all || { total: 0, unlocked: 0 }}
        onClick={() => onCategoryChange('all')}
      />
      {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((category) => {
        const count = categoryCounts[category] || { total: 0, unlocked: 0 };
        if (count.total === 0) return null;
        return (
          <CategoryTab
            key={category}
            label={CATEGORY_LABELS[category]}
            icon={CATEGORY_ICONS[category]}
            isActive={selectedCategory === category}
            count={count}
            onClick={() => onCategoryChange(category)}
          />
        );
      })}
    </div>
  );
}

interface CategoryTabProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  count: CategoryCount;
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
