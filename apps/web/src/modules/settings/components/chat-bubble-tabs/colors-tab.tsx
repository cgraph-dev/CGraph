/**
 * Chat bubble color settings tab.
 * @module
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Colors Tab component.
 */
export function ColorsTab({ style, updateStyle }: TabProps) {
  return (
    <GlassCard variant="frosted" className="space-y-6 p-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Your Messages</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={style.ownMessageBg}
            onChange={(e) => updateStyle('ownMessageBg', e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-lg"
          />
          <input
            type="text"
            value={style.ownMessageBg}
            onChange={(e) => updateStyle('ownMessageBg', e.target.value)}
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 font-mono text-sm text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Other Messages</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={style.otherMessageBg}
            onChange={(e) => updateStyle('otherMessageBg', e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-lg"
          />
          <input
            type="text"
            value={style.otherMessageBg}
            onChange={(e) => updateStyle('otherMessageBg', e.target.value)}
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 font-mono text-sm text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Use Gradient</label>
        <button
          onClick={() => updateStyle('useGradient', !style.useGradient)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.useGradient ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.useGradient ? 24 : 0 }}
          />
        </button>
      </div>

      {style.useGradient && (
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-300">Gradient Direction</label>
          <div className="grid grid-cols-3 gap-2">
            {(['horizontal', 'vertical', 'diagonal'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => updateStyle('gradientDirection', dir)}
                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                  style.gradientDirection === dir
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
