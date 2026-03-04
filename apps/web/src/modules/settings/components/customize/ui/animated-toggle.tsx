/**
 * Animated toggle switch component
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';
import { motion } from 'motion/react';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { uiSprings as springs, toggleSizeConfig } from './constants';
import type { AnimatedToggleProps } from './types';

export const AnimatedToggle = memo(function AnimatedToggle({
  enabled,
  onToggle,
  colorPreset = 'emerald',
  size = 'md',
  disabled = false,
}: AnimatedToggleProps) {
  const colors = themeColors[colorPreset];
  const config = toggleSizeConfig[size];
  const offset = enabled ? config.enabledOffset : config.disabledOffset;

  return (
    <motion.button
      className={`relative ${config.track} rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      style={{
        background: enabled
          ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          : '#374151',
        boxShadow: enabled ? `0 0 12px ${colors.glow}` : 'none',
      }}
      onClick={() => !disabled && onToggle()}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      <motion.div
        className={`absolute top-0.5 ${config.dot} rounded-full bg-white shadow-lg`}
        animate={{ left: offset }}
        transition={springs.snappy}
      />
    </motion.button>
  );
});
