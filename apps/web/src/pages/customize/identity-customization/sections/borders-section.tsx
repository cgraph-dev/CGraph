/**
 * BordersSection Component
 *
 * Displays the borders selection grid with theme filtering and animations.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Border, Rarity } from '../types';
import {
  ALL_BORDERS,
  BORDER_THEMES,
  getLegacyBordersByTheme,
  type BorderTheme,
} from '@/data/avatar-borders';
import ThemedBorderCard from '@/modules/settings/components/customize/themed-border-card';

export interface BordersSectionProps {
  borders: Border[];
  selectedBorder: string | null;
  previewingBorder: string | null;
  onEquip: (borderId: string, border: Border) => void;
  /** Whether the parent has an active search/rarity filter */
  hasActiveFilter?: boolean;
}

/**
 * unknown for the customize module.
 */
/**
 * Borders Section section component.
 */
export function BordersSection({
  borders,
  selectedBorder,
  previewingBorder,
  onEquip,
  hasActiveFilter = false,
}: BordersSectionProps) {
  const [selectedTheme, setSelectedTheme] = useState<BorderTheme | 'all'>('all');
  const [showAnimations, setShowAnimations] = useState(true);

  // Get borders from the new collection system
  const themedBorders = useMemo(() => {
    if (selectedTheme === 'all') {
      return ALL_BORDERS;
    }
    return getLegacyBordersByTheme(selectedTheme);
  }, [selectedTheme]);

  // Filter by search query from parent (using the borders prop for search results)
  const displayBorders = useMemo(() => {
    // If parent has an active search/rarity filter, cross-reference with themed borders
    if (hasActiveFilter && borders.length > 0) {
      const borderIds = new Set(borders.map((b) => b.id));
      // Show only themed borders that match the parent filter
      return themedBorders.filter((tb) => borderIds.has(tb.id));
    }
    // No active filter — show all themed borders (respects theme selector)
    return themedBorders;
  }, [borders, themedBorders, hasActiveFilter]);

  return (
    <div className="space-y-6">
      {/* Theme Category Selector */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          onClick={() => setSelectedTheme('all')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
            selectedTheme === 'all'
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/25'
              : 'hover:bg-white/[0.10]/50 border border-white/10 bg-white/[0.06] text-gray-400 hover:text-white'
          } `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>✨</span>
          <span>All Borders</span>
          <span className="text-xs opacity-70">({ALL_BORDERS.length})</span>
        </motion.button>

        {BORDER_THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              selectedTheme === theme.id
                ? 'text-white shadow-lg'
                : 'hover:bg-white/[0.10]/50 border border-white/10 bg-white/[0.06] text-gray-400 hover:text-white'
            } `}
            style={{
              background:
                selectedTheme === theme.id
                  ? `linear-gradient(135deg, ${theme.accentColor}cc, ${theme.accentColor}66)`
                  : undefined,
              boxShadow:
                selectedTheme === theme.id ? `0 4px 20px ${theme.accentColor}40` : undefined,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{theme.icon}</span>
            <span>{theme.name}</span>
            <span className="text-xs opacity-70">({theme.borderCount})</span>
          </motion.button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showAnimations}
              onChange={(e) => setShowAnimations(e.target.checked)}
              className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.06] text-primary-500 focus:ring-primary-500"
            />
            Show Animations
          </label>
        </div>
        <div className="text-sm text-gray-500">Showing {displayBorders.length} borders</div>
      </div>

      {/* Borders Grid */}
      <motion.div className="grid grid-cols-4 gap-4 lg:grid-cols-5 xl:grid-cols-6" layout>
        <AnimatePresence mode="popLayout">
          {displayBorders.map((border, index) => {
            const isSelected = selectedBorder === border.id;
            const isPreviewing = previewingBorder === border.id;

            return (
              <motion.div
                key={border.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  delay: Math.min(index * 0.02, 0.3),
                  layout: { duration: durations.slow.ms / 1000 },
                }}
              >
                <ThemedBorderCard
                  border={border}
                  isSelected={isSelected || isPreviewing}
                  onSelect={() => {
                    // Map to old border format for handler
                    const oldBorder: Border = {
                      id: border.id,
                      name: border.name,

                       
                      rarity: border.rarity === 'free' ? 'common' : (border.rarity as Rarity), // safe downcast – compatible rarity union
                      animation: border.animationType,
                      colors: border.colors,
                      unlocked: border.unlocked,
                      unlockRequirement: border.unlockRequirement,
                    };
                    onEquip(border.id, oldBorder);
                  }}
                  showAnimation={showAnimations}
                  size="md"
                  allowPreview={true}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {displayBorders.length === 0 && (
        <motion.div
          className="col-span-full py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 text-4xl">🔍</div>
          <p className="text-gray-400">No borders found matching your filters.</p>
          <button
            onClick={() => setSelectedTheme('all')}
            className="mt-4 text-sm text-primary-400 hover:text-primary-300"
          >
            View all borders
          </button>
        </motion.div>
      )}
    </div>
  );
}
