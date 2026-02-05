/**
 * ProfileControlPanel Component
 *
 * Control panel for profile card customization settings.
 *
 * @module components/landing/CustomizationDemo/ProfileControlPanel
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DemoState, ProfileCardStyle } from './types';
import { themeColors } from './constants';
import { springs } from '../animations';

interface ProfileControlPanelProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

export const ProfileControlPanel = memo(function ProfileControlPanel({
  state,
  onChange,
}: ProfileControlPanelProps) {
  const colors = themeColors[state.theme];

  return (
    <div className="space-y-5">
      {/* Profile Card Style */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Card Style</label>
        <div className="grid grid-cols-2 gap-2">
          {(['minimal', 'detailed', 'compact', 'expanded', 'gaming'] as ProfileCardStyle[]).map(
            (style) => (
              <motion.button
                key={style}
                className={`rounded-lg border px-3 py-2 text-xs capitalize transition-all ${
                  state.profileCardStyle === style
                    ? 'border-white/50 bg-white/10 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}
                onClick={() => onChange({ profileCardStyle: style })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {style}
              </motion.button>
            )
          )}
        </div>
      </div>

      {/* Profile Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Display Options</label>
        {[
          { key: 'showBadges', label: 'Show Badges', icon: '🏆' },
          { key: 'showStatus', label: 'Show Status', icon: '🟢' },
          { key: 'animatedBackground', label: 'Animated Background', icon: '🎨' },
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

      {/* Profile Theme hint */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
          <span>✨</span> Profile Themes
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Select a border theme in the Avatar tab to unlock Next-Gen Profile Themes with animated
          backgrounds and particle effects.
        </p>
      </div>
    </div>
  );
});
