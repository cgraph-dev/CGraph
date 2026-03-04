/**
 * Avatar Tab Component
 *
 * Avatar border and glow customization.
 */

import { motion } from 'motion/react';
 
import { THEME_COLORS, type ThemeColorPreset } from '@/stores/theme';
import { PremiumThemeGate, TierBadge } from '../premium-theme-gate';

import type { AvatarTabProps } from './types';
import { AVATAR_BORDER_OPTIONS } from './constants';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the theme module.
 */
/**
 * Avatar Tab component.
 */
export function AvatarTab({
  selectedBorder,
  selectedColor,
  onSelectBorder,
  onSelectColor,
  glowEnabled,
  onToggleGlow,
}: AvatarTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Avatar Border</h3>
      <p className="mb-6 text-sm text-gray-400">Customize how your avatar appears to others</p>

      {/* Border Types */}
      <div className="mb-8 grid grid-cols-5 gap-3">
        {AVATAR_BORDER_OPTIONS.map((option) => {
          const isPremium = option.tier !== 'free';
          const isSelected = selectedBorder === option.value;

          const content = (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isPremium && onSelectBorder(option.value)}
              disabled={isPremium}
              className={`relative rounded-xl p-3 transition-all ${
                isSelected
                  ? 'bg-primary-600/20 ring-2 ring-primary-500'
                  : 'bg-white/[0.06] hover:bg-white/[0.10]'
              } ${isPremium ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="text-center">
                <span className="text-sm font-medium text-gray-300">{option.label}</span>
                <TierBadge tier={option.tier} />
              </div>
            </motion.button>
          );

          if (isPremium) {
            return (
              <PremiumThemeGate
                key={option.value}
                requiredTier={option.tier}
                featureName={`${option.label} border`}
                showPreview={false}
              >
                {content}
              </PremiumThemeGate>
            );
          }

          return <div key={option.value}>{content}</div>;
        })}
      </div>

      {/* Border Color */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">Border Color</h4>
        <div className="flex flex-wrap gap-2">
          { }
          {(Object.keys(THEME_COLORS) as ThemeColorPreset[]).map((preset) => ( // type assertion: Object.keys returns string[], narrowing to known keys
            <motion.button
              key={preset}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelectColor(preset)}
              className={`h-8 w-8 rounded-full ${
                selectedColor === preset
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                  : ''
              }`}
              style={{ backgroundColor: THEME_COLORS[preset].primary }}
            />
          ))}
        </div>
      </div>

      {/* Glow Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-white/[0.06] p-4">
        <div>
          <span className="font-medium text-white">Glow Effect</span>
          <p className="text-xs text-gray-400">Add ambient glow around your avatar</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleGlow}
          className={`h-6 w-12 rounded-full transition-colors ${
            glowEnabled ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            animate={{ x: glowEnabled ? 24 : 0 }}
            className="h-6 w-6 rounded-full bg-white shadow-lg"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default AvatarTab;
