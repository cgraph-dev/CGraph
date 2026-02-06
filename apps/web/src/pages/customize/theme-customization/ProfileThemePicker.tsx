/**
 * ProfileThemePicker component for enhanced profile theme selection
 * @module pages/customize/theme-customization
 */

import { motion } from 'framer-motion';
import {
  ALL_PROFILE_THEMES,
  PROFILE_THEME_CATEGORIES,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
} from '@/data/profileThemes';
import ProfileThemeCard, {
  ProfileThemeGrid,
} from '@/modules/settings/components/customize/ProfileThemeCard';

interface ProfileThemePickerProps {
  useNewProfileThemes: boolean;
  onToggleNewThemes: () => void;
  profileThemeCategory: ProfileThemeCategory | 'all';
  onCategoryChange: (category: ProfileThemeCategory | 'all') => void;
  filteredThemes: ProfileThemeConfig[];
  selectedProfileThemeId: string;
  onApplyTheme: (theme: ProfileThemeConfig) => void;
}

export function ProfileThemePicker({
  useNewProfileThemes,
  onToggleNewThemes,
  profileThemeCategory,
  onCategoryChange,
  filteredThemes,
  selectedProfileThemeId,
  onApplyTheme,
}: ProfileThemePickerProps) {
  return (
    <>
      {/* Toggle & Subcategory Controls */}
      {useNewProfileThemes && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Enhanced Themes</span>
            <button
              onClick={onToggleNewThemes}
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              {useNewProfileThemes ? 'View Classic Themes' : 'View Enhanced Themes'}
            </button>
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
      )}

      {/* Theme Grid (rendered when new profile themes are active) */}
      {useNewProfileThemes && (
        <motion.div
          key="profile-new"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
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
      )}
    </>
  );
}
