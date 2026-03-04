/**
 * Speed and size selector components
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';
import { motion } from 'motion/react';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { speedOptions, sizeOptions } from './constants';
import type { SpeedSelectorProps, SizeSelectorProps } from './types';

export const SpeedSelector = memo(function SpeedSelector({
  value,
  onChange,
  colorPreset = 'emerald',
}: SpeedSelectorProps) {
  const colors = themeColors[colorPreset];

  return (
    <div className="flex gap-2">
      {speedOptions.map((option) => {
        const isSelected = option.id === value;

        return (
          <motion.button
            key={option.id}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              isSelected
                ? 'border border-white/20 text-white'
                : 'border border-transparent bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : undefined,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            onClick={() => onChange(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

export const SizeSelector = memo(function SizeSelector({
  value,
  onChange,
  colorPreset = 'emerald',
}: SizeSelectorProps) {
  const colors = themeColors[colorPreset];

  return (
    <div className="flex gap-2">
      {sizeOptions.map((option) => {
        const isSelected = option.id === value;

        return (
          <motion.button
            key={option.id}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
              isSelected
                ? 'border border-white/20 text-white'
                : 'border border-transparent bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : undefined,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            onClick={() => onChange(option.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
});
