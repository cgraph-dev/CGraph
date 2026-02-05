/**
 * AvatarControlPanel Component
 *
 * Control panel for avatar border and size settings.
 *
 * @module components/landing/CustomizationDemo/AvatarControlPanel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState, AvatarBorderType, ThemePreset } from './types';
import { themeColors, avatarBorders, rarityColors } from './constants';
import { AnimatedAvatar } from './AnimatedAvatar';

interface AvatarControlPanelProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

export const AvatarControlPanel = memo(function AvatarControlPanel({
  state,
  onChange,
}: AvatarControlPanelProps) {
  const speedMultiplier =
    state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  return (
    <div className="space-y-5">
      {/* Avatar Preview */}
      <div className="flex justify-center py-4">
        <AnimatedAvatar
          borderType={state.avatarBorder}
          borderColor={state.avatarBorderColor}
          size="large"
          speedMultiplier={speedMultiplier}
        />
      </div>

      {/* Border Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Avatar Border</label>
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.entries(avatarBorders) as [
              AvatarBorderType,
              (typeof avatarBorders)[AvatarBorderType],
            ][]
          ).map(([type, info]) => (
            <motion.button
              key={type}
              className={`relative rounded-lg border p-2 text-left transition-all ${
                state.avatarBorder === type
                  ? 'border-white/50 bg-white/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => onChange({ avatarBorder: type })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${state.avatarBorder === type ? 'text-white' : 'text-gray-400'}`}
                >
                  {info.name}
                </span>
                {info.premium && info.rarity && (
                  <span
                    className="rounded px-1 py-0.5 text-[9px] font-bold"
                    style={{ background: rarityColors[info.rarity], color: '#fff' }}
                  >
                    {info.rarity}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-gray-500">{info.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Border Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((color) => (
            <motion.button
              key={color}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                state.avatarBorderColor === color ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[color].primary}, ${themeColors[color].secondary})`,
              }}
              onClick={() => onChange({ avatarBorderColor: color })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Avatar Size */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Avatar Size</label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <motion.button
              key={size}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                state.avatarSize === size
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ avatarSize: size })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {size}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});
