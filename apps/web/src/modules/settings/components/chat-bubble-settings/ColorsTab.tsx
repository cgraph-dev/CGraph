import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * ColorsTab - Color customization for chat bubbles
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
            className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
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
            className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Use Gradient</label>
        <button
          onClick={() => updateStyle('useGradient', !style.useGradient)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.useGradient ? 'bg-primary-600' : 'bg-dark-600'
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
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
