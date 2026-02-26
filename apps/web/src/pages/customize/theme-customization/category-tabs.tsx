/**
 * CategoryTabs component for theme category selection
 * @module pages/customize/theme-customization
 */

import {
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ALL_PROFILE_THEMES } from '@/data/profileThemes';
import type { ThemeCategory } from './types';

interface CategoryTabItem {
  id: ThemeCategory;
  label: string;
  icon: typeof UserCircleIcon;
  count: number;
}

export const CATEGORIES: CategoryTabItem[] = [
  {
    id: 'profile',
    label: 'Profile Themes',
    icon: UserCircleIcon,
    count: ALL_PROFILE_THEMES.length,
  },
  { id: 'chat', label: 'Chat Themes', icon: ChatBubbleLeftRightIcon, count: 5 },
  { id: 'forum', label: 'Forum Themes', icon: NewspaperIcon, count: 4 },
  { id: 'app', label: 'App Themes', icon: Squares2X2Icon, count: 4 },
];

interface CategoryTabsProps {
  activeCategory: ThemeCategory;
  onCategoryChange: (category: ThemeCategory) => void;
}

/**
 * unknown for the customize module.
 */
/**
 * Category Tabs component.
 */
export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 border-b border-white/10 pb-4">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              activeCategory === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" />
            {category.label}
            <span className="text-xs opacity-60">({category.count})</span>
          </button>
        );
      })}
    </div>
  );
}
