/**
 * Option button component for style selection
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { uiSprings as springs, rarityColorMap } from './constants';
import type { OptionButtonProps } from './types';

export const OptionButton = memo(function OptionButton({
  selected,
  onClick,
  icon,
  label,
  description,
  premium,
  rarity,
  colorPreset = 'emerald',
}: OptionButtonProps) {
  const colors = themeColors[colorPreset];

  return (
    <motion.button
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
        selected
          ? 'border-white/30 bg-white/10'
          : 'hover:bg-white/8 border-white/10 bg-white/5 hover:border-white/20'
      }`}
      style={{
        boxShadow: selected ? `0 0 20px ${colors.glow}` : 'none',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`
                : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{label}</span>
            {rarity && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: `${rarityColorMap[rarity]}30`,
                  color: rarityColorMap[rarity],
                }}
              >
                {rarity}
              </span>
            )}
            {premium && !rarity && (
              <span className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">
                PRO
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 truncate text-xs text-white/60">{description}</p>}
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.bouncy}
        >
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
});
