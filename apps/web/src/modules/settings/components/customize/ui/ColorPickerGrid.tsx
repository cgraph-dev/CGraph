/**
 * Color picker grid component
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { allThemes, colorPickerSizeConfig } from './constants';
import type { ColorPickerGridProps } from './types';

export const ColorPickerGrid = memo(function ColorPickerGrid({
  selected,
  onSelect,
  size = 'md',
}: ColorPickerGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {allThemes.map((preset) => {
        const colors = themeColors[preset];
        const isSelected = preset === selected;

        return (
          <motion.button
            key={preset}
            className={`${colorPickerSizeConfig[size]} rounded-full border-2 ${
              isSelected ? 'border-white' : 'border-transparent'
            }`}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isSelected ? `0 0 15px ${colors.glow}` : 'none',
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(preset)}
            title={colors.name}
          />
        );
      })}
    </div>
  );
});
