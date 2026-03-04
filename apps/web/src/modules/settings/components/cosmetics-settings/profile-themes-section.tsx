/**
 * Profile Themes Section
 *
 * Manages profile theme selection with visual previews.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { useThemeStore } from '@/stores/theme';

import type { SectionProps, ThemePresetWithId } from './types';
import { THEME_PRESETS_ARRAY } from './constants';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Profile Themes Section section component.
 */
export function ProfileThemesSection({ filters, setFilters, viewMode: _viewMode }: SectionProps) {
  void _viewMode; // Reserved for future view mode toggle
  const profileThemeId = useThemeStore((s) => s.profileThemeId);
  const setProfileTheme = useThemeStore((s) => s.setProfileTheme);

  const filteredPresets = useMemo(() => {
    let result = THEME_PRESETS_ARRAY;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p: ThemePresetWithId) =>
          p.name.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [filters.search]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search themes..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
        />
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPresets.map((preset: ThemePresetWithId) => {
          const isActive = profileThemeId === preset.id;

          return (
            <motion.div
              key={preset.id}
              layout
              className={`relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                isActive
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                background:
                  preset.backgroundConfig?.type === 'gradient'
                    ? preset.backgroundConfig.value
                    : preset.colors?.background || '#1a1a1a',
              }}
              onClick={() => setProfileTheme(preset.id)}
            >
              {/* Preview Content */}
              <div className="min-h-[200px] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full"
                    style={{ background: preset.colors?.accent || '#3b82f6' }}
                  />
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: preset.colors?.primary || '#ffffff' }}
                    >
                      {preset.name}
                    </h3>
                    <p className="text-sm" style={{ color: preset.colors?.secondary || '#888888' }}>
                      Profile Theme
                    </p>
                  </div>
                </div>

                <p
                  className="line-clamp-2 text-sm"
                  style={{ color: preset.colors?.text || '#ffffff' }}
                >
                  {preset.description}
                </p>

                {/* Color Palette */}
                <div className="mt-4 flex gap-2">
                  {Object.entries(preset.colors || {})
                    .slice(0, 5)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="h-6 w-6 rounded-full border border-white/20"
                        style={{ background: value }}
                        title={key}
                      />
                    ))}
                </div>
              </div>

              {/* Active Badge */}
              {isActive && (
                <div className="absolute right-3 top-3 rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium">
                  Active
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs">
                {preset.cardLayout || 'standard'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileThemesSection;
