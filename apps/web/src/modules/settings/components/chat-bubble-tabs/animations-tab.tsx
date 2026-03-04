/**
 * Chat bubble animation settings tab.
 * @module
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Animations Tab component.
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
                  : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
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
            style.hoverEffect ? 'bg-primary-600' : 'bg-white/[0.08]'
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
