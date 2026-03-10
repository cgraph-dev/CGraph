/**
 * SecretThemeSection
 *
 * Customization section for selecting a secret chat theme.
 * Distinct from regular chat themes — this is a separate equip slot
 * for the encrypted secret chat experience.
 *
 * @module pages/customize/theme-customization/secret-theme-section
 */

import { memo, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { useSecretChatStore } from '@/modules/secret-chat/store';
import { SECRET_THEMES } from '@/modules/secret-chat/themes';
import type { SecretThemeId } from '@/modules/secret-chat/store/types';

/** Props for the SecretThemeSection component */
export interface SecretThemeSectionProps {
  /** Optional search query to filter themes */
  searchQuery?: string;
}

/**
 * Secret theme selection grid.
 * Each card shows a preview of the theme with name and description.
 */
export const SecretThemeSection = memo(function SecretThemeSection({
  searchQuery = '',
}: SecretThemeSectionProps) {
  const selectedThemeId = useSecretChatStore((s) => s.selectedThemeId);
  const setTheme = useSecretChatStore((s) => s.setTheme);

  const filteredThemes = useMemo(() => {
    if (!searchQuery) return SECRET_THEMES;
    const q = searchQuery.toLowerCase();
    return SECRET_THEMES.filter(
      (theme) =>
        theme.name.toLowerCase().includes(q) ||
        theme.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelect = useCallback(
    (themeId: SecretThemeId) => {
      setTheme(themeId);
    },
    [setTheme]
  );

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm" role="img" aria-label="lock">🔒</span>
          <span className="text-sm font-medium text-white/80">Secret Chat Themes</span>
        </div>
        <span className="text-xs text-white/40">
          {filteredThemes.length} themes
        </span>
      </div>

      <p className="text-xs text-white/40">
        Choose a theme for your encrypted secret conversations. This is separate from your regular chat theme.
      </p>

      {/* Theme Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filteredThemes.map((theme) => {
          const isSelected = selectedThemeId === theme.id;

          return (
            <motion.button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Color swatch */}
              <div
                className="h-8 w-full rounded-lg"
                style={{ backgroundColor: theme.previewColor }}
              />

              {/* Theme name */}
              <span
                className={`text-xs font-semibold ${
                  isSelected ? 'text-primary-400' : 'text-white/70'
                }`}
              >
                {theme.name}
              </span>

              {/* Description */}
              <span className="text-[10px] leading-tight text-white/30">
                {theme.description}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {filteredThemes.length === 0 && (
        <p className="py-4 text-center text-sm text-white/30">
          No secret themes match your search.
        </p>
      )}
    </div>
  );
});
