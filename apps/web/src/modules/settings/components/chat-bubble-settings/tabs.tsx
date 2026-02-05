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

/**
 * ShapeTab - Shape customization for chat bubbles
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
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
            style.showTail ? 'bg-primary-600' : 'bg-dark-600'
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
            style.glassEffect ? 'bg-primary-600' : 'bg-dark-600'
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
            style.showAvatar ? 'bg-primary-600' : 'bg-dark-600'
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
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
            style.showTimestamp ? 'bg-primary-600' : 'bg-dark-600'
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
                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
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
