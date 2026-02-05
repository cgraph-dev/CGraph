/**
 * ProfileThemeShowcase Component
 *
 * Displays a grid of profile themes for a selected category.
 *
 * @module components/landing/CustomizationDemo/ProfileThemeShowcase
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { ProfileThemeShowcaseProps } from './types';
import { ProfileThemeCard } from './ProfileThemeCard';
import { getThemesByCategory } from './profileThemes';

export const ProfileThemeShowcase = memo(function ProfileThemeShowcase({
  theme,
  selectedThemeId,
  onThemeSelect,
}: ProfileThemeShowcaseProps) {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // Get themes for current category
  const currentCategoryThemes = getThemesByCategory(theme);

  if (!currentCategoryThemes || currentCategoryThemes.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-4 backdrop-blur-sm">
        <div className="mb-3 text-center text-xs font-medium text-gray-400">
          Next-Gen Profile Themes • Click to select
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-3 gap-2">
          {currentCategoryThemes.map((themeConfig, idx) => (
            <ProfileThemeCard
              key={themeConfig.id}
              theme={themeConfig}
              isSelected={selectedThemeId === themeConfig.id}
              isHovered={hoveredTheme === themeConfig.id}
              onSelect={() => onThemeSelect(themeConfig.id)}
              onHover={(hovered) => setHoveredTheme(hovered ? themeConfig.id : null)}
              delay={idx * 0.05}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});
