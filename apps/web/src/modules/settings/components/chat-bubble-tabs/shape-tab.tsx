/**
 * Chat bubble shape settings tab.
 * @module
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Shape Tab component.
 */
export function ShapeTab({ style, updateStyle }: TabProps) {
  return (
    <GlassCard variant="frosted" className="space-y-6 p-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Border Radius</label>
          <span className="text-sm text-primary-400">{style.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={style.borderRadius}
          onChange={(e) => updateStyle('borderRadius', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Bubble Shape</label>
        <div className="grid grid-cols-2 gap-2">
          {(['rounded', 'sharp', 'super-rounded', 'bubble', 'modern'] as const).map((shape) => (
            <button
              key={shape}
              onClick={() => updateStyle('bubbleShape', shape)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                style.bubbleShape === shape
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10]'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Show Tail</label>
        <button
          onClick={() => updateStyle('showTail', !style.showTail)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.showTail ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.showTail ? 24 : 0 }}
          />
        </button>
      </div>
    </GlassCard>
  );
}
