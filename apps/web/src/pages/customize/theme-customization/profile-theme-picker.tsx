/**
 * ProfileThemePicker component for profile theme selection
 * @module pages/customize/theme-customization
 */

import { motion } from 'motion/react';
import {
  ALL_PROFILE_THEMES,
  PROFILE_THEME_CATEGORIES,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
} from '@/data/profileThemes';
import ProfileThemeCard, {
  ProfileThemeGrid,
} from '@/modules/settings/components/customize/profile-theme-card';
import { tweens } from '@/lib/animation-presets';

interface ProfileThemePickerProps {
  profileThemeCategory: ProfileThemeCategory | 'all';
  onCategoryChange: (category: ProfileThemeCategory | 'all') => void;
  filteredThemes: ProfileThemeConfig[];
  selectedProfileThemeId: string;
  onApplyTheme: (theme: ProfileThemeConfig) => void;
}

/**
 * Profile Theme Picker — single unified theme selector.
 * @description Renders the profile theme category filter and theme grid.
 */
export function ProfileThemePicker({
  profileThemeCategory,
  onCategoryChange,
  filteredThemes,
  selectedProfileThemeId,
  onApplyTheme,
}: ProfileThemePickerProps) {
  return (
    <>
      {/* Subcategory Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/80">Profile Themes</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              profileThemeCategory === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            All ({ALL_PROFILE_THEMES.length})
          </button>
          {PROFILE_THEME_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                profileThemeCategory === cat.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Grid */}
      <motion.div
        key="profile-themes"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={tweens.fast}
      >
        <ProfileThemeGrid>
          {filteredThemes.map((theme) => (
            <ProfileThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedProfileThemeId === theme.id}
              onSelect={() => onApplyTheme(theme)}
            />
          ))}
        </ProfileThemeGrid>

        {filteredThemes.length === 0 && (
          <div className="py-12 text-center text-white/60">
            No themes found matching your search.
          </div>
        )}
      </motion.div>
    </>
  );
}
