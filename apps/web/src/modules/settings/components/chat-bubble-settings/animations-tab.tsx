/**
 * Animations settings tab for chat bubble customization.
 * @module modules/settings/components/chat-bubble-settings/animations-tab
 */
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * AnimationsTab - Animation customization
 */
export function AnimationsTab({ style, updateStyle }: TabProps) {
  return (
    <GlassCard variant="frosted" className="space-y-6 p-6">
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Entrance Animation</label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'slide', 'fade', 'scale', 'bounce', 'flip'] as const).map((anim) => (
            <button
              key={anim}
              onClick={() => updateStyle('entranceAnimation', anim)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                style.entranceAnimation === anim
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {anim}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Hover Effect</label>
        <button
          onClick={() => updateStyle('hoverEffect', !style.hoverEffect)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.hoverEffect ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.hoverEffect ? 24 : 0 }}
          />
        </button>
      </div>
    </GlassCard>
  );
}
