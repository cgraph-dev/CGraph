/**
 * Effects settings tab for chat bubble customization.
 * @module modules/settings/components/chat-bubble-settings/effects-tab
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import type { TabProps } from './types';

/**
 * EffectsTab - Visual effects customization
 */
export function EffectsTab({ style, updateStyle }: TabProps) {
  return (
    <GlassCard variant="frosted" className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Glass Effect</label>
        <button
          onClick={() => updateStyle('glassEffect', !style.glassEffect)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            style.glassEffect ? 'bg-primary-600' : 'bg-white/[0.08]'
          }`}
        >
          <motion.div
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
            animate={{ x: style.glassEffect ? 24 : 0 }}
          />
        </button>
      </div>

      {style.glassEffect && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Glass Blur</label>
            <span className="text-sm text-primary-400">{style.glassBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={style.glassBlur}
            onChange={(e) => updateStyle('glassBlur', Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Shadow Intensity</label>
          <span className="text-sm text-primary-400">{style.shadowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.shadowIntensity}
          onChange={(e) => updateStyle('shadowIntensity', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Border Width</label>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </GlassCard>
  );
}
