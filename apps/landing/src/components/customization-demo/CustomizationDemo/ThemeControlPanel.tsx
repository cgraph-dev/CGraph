/**
 * ThemeControlPanel Component
 *
 * Control panel for theme color and effect settings.
 *
 * @module components/landing/CustomizationDemo/ThemeControlPanel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState, ThemePreset, EffectPreset } from './types';
import { themeColors } from './constants';
import { springs } from '../animations';

interface ThemeControlPanelProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

export const ThemeControlPanel = memo(function ThemeControlPanel({
  state,
  onChange,
}: ThemeControlPanelProps) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-5">
      {/* Theme Colors */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Theme Color</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(themeColors) as ThemePreset[]).map((theme) => (
            <motion.button
              key={theme}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                state.theme === theme ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors[theme].primary}, ${themeColors[theme].secondary})`,
                boxShadow: state.theme === theme ? `0 0 15px ${themeColors[theme].glow}` : 'none',
              }}
              onClick={() => onChange({ theme })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={themeColors[theme].name}
              aria-label={`Select ${themeColors[theme].name} theme`}
            />
          ))}
        </div>
      </div>

      {/* Effect Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Effect Style</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              'glassmorphism',
              'neon',
              'holographic',
              'minimal',
              'aurora',
              'cyberpunk',
            ] as EffectPreset[]
          ).map((effect) => (
            <motion.button
              key={effect}
              className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                state.effect === effect
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ effect })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {effect}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Animation Speed */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Animation Speed</label>
        <div className="flex gap-2">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <motion.button
              key={speed}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                state.animationSpeed === speed
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => onChange({ animationSpeed: speed })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Visual Effects Toggles */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Visual Effects</label>
        {[
          { key: 'particlesEnabled', label: 'Ambient Particles', icon: '✨' },
          { key: 'glowEnabled', label: 'Glow Effects', icon: '💫' },
          { key: 'blurEnabled', label: 'Blur/Glassmorphism', icon: '🌫️' },
        ].map(({ key, label, icon }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-3 transition-colors hover:border-white/20"
          >
            <span className="flex items-center gap-2 text-sm text-gray-300">
              <span>{icon}</span> {label}
            </span>
            <motion.div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                state[key as keyof DemoState] ? '' : 'bg-gray-700'
              }`}
              style={{
                background: state[key as keyof DemoState]
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
              onClick={() => onChange({ [key]: !state[key as keyof DemoState] })}
            >
              <motion.div
                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-lg"
                animate={{ left: state[key as keyof DemoState] ? '24px' : '4px' }}
                transition={springs.snappy}
              />
            </motion.div>
          </label>
        ))}
      </div>
    </div>
  );
});
