/**
 * ThemeDescription component showing category info
 * @module pages/customize/theme-customization
 */

import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ThemeCategory } from './types';
import { CATEGORIES } from './category-tabs';

const CATEGORY_DESCRIPTIONS: Record<ThemeCategory, string> = {
  profile:
    'Customize your profile with animated themes featuring particles, gradients, and stunning visual effects. These themes affect how your profile appears to others.',
  chat: 'Change chat bubble colors, backgrounds, and message styling. These themes affect all your conversations.',
  forum:
    'Modify forum post layouts, colors, and card styles. These themes affect how forums appear to you.',
  app: 'Change the global app color scheme, navigation, and backgrounds. These themes affect the entire application.',
};

interface ThemeDescriptionProps {
  activeCategory: ThemeCategory;
}

/**
 * unknown for the customize module.
 */
/**
 * Theme Description component.
 */
export function ThemeDescription({ activeCategory }: ThemeDescriptionProps) {
  return (
    <GlassCard variant="frosted" className="p-4">
      <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
        <SparklesIcon className="h-5 w-5 text-primary-400" />
        {CATEGORIES.find((c) => c.id === activeCategory)?.label}
      </h3>
      <p className="text-sm text-white/60">{CATEGORY_DESCRIPTIONS[activeCategory]}</p>
    </GlassCard>
  );
}
