/**
 * Layout settings tab for chat bubble customization.
 * @module modules/settings/components/chat-bubble-settings/layout-tab
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * LayoutTab - Layout customization
 */
export function LayoutTab({ style, updateStyle }: TabProps) {
  return (
    <GlassCard variant="frosted" className="space-y-6 p-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Max Width</label>
          <span className="text-sm text-primary-400">{style.maxWidth}%</span>
        </div>
        <input
          type="range"
          min="40"
          max="90"
          value={style.maxWidth}
          onChange={(e) => updateStyle('maxWidth', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Avatar</label>
        <button
          onClick={() => updateStyle('showAvatar', !style.showAvatar)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.showAvatar ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.showAvatar ? 24 : 0 }}
          />
        </button>
      </div>

      {style.showAvatar && (
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-300">Avatar Size</label>
          <div className="grid grid-cols-3 gap-2">
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateStyle('avatarSize', size)}
                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                  style.avatarSize === size
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
                }`}
              >
                {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Timestamp</label>
        <button
          onClick={() => updateStyle('showTimestamp', !style.showTimestamp)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.showTimestamp ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.showTimestamp ? 24 : 0 }}
          />
        </button>
      </div>

      {style.showTimestamp && (
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-300">Timestamp Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['inside', 'outside', 'hover'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => updateStyle('timestampPosition', pos)}
                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                  style.timestampPosition === pos
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
