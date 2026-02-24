/**
 * AvatarStylePicker component for customizing avatar appearance
 * @module components/ui/animated-avatar
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

import type { BorderCategory } from './types';
import { BORDER_STYLES, AVATAR_CATEGORIES } from './constants';
import { useAvatarStyle } from './store';
import AnimatedAvatar from './animated-avatar';
import { tweens, loop, springs } from '@/lib/animation-presets';

const CATEGORIES = AVATAR_CATEGORIES;

export function AvatarStylePicker() {
  const { style, ownedStyles, updateStyle, resetStyle } = useAvatarStyle();
  const [activeCategory, setActiveCategory] = useState<BorderCategory>('free');

  const filteredStyles = BORDER_STYLES.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Avatar Customization</h3>
        <button
          onClick={resetStyle}
          className="text-sm text-gray-400 transition-colors hover:text-white"
        >
          Reset to Default
        </button>
      </div>

      {/* Preview */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-dark-800/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5" />
        <AnimatedAvatar
          alt="Preview"
          size="3xl"
          fallbackText="You"
          showStatus
          statusType="online"
          level={42}
          isPremium
          title={{ name: 'Legend', color: '#ffd700' }}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Border Styles Grid */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Border Style</label>
        <div className="grid grid-cols-3 gap-2">
          {filteredStyles.map((bs) => {
            const isOwned = ownedStyles.includes(bs.id);
            const isSelected = style.borderStyle === bs.id;

            return (
              <motion.button
                key={bs.id}
                onClick={() => isOwned && updateStyle('borderStyle', bs.id)}
                disabled={!isOwned}
                className={`relative overflow-hidden rounded-lg p-3 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                    : isOwned
                      ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      : 'cursor-not-allowed bg-dark-800 text-gray-500 opacity-60'
                }`}
                whileHover={isOwned ? { scale: 1.02 } : {}}
                whileTap={isOwned ? { scale: 0.98 } : {}}
              >
                <div className="font-semibold">{bs.name}</div>
                {!isOwned && (
                  <div className="mt-1 text-[10px] text-yellow-500">🔒 {bs.coinPrice} coins</div>
                )}
                {bs.category === 'legendary' && isOwned && (
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, transparent 40%, rgba(255,215,0,0.1) 50%, transparent 60%)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={loop(tweens.ambient)}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Border Width */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Border Width</label>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="6"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.borderColor}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border-0"
            />
            <input
              type="text"
              value={style.borderColor}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.secondaryColor}
              onChange={(e) => updateStyle('secondaryColor', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-lg border-0"
            />
            <input
              type="text"
              value={style.secondaryColor}
              onChange={(e) => updateStyle('secondaryColor', e.target.value)}
              className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Glow Intensity */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Glow Intensity</label>
          <span className="text-sm text-primary-400">{style.glowIntensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.glowIntensity}
          onChange={(e) => updateStyle('glowIntensity', Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Animation Speed */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Animation Speed</label>
        <div className="grid grid-cols-5 gap-2">
          {(['none', 'slow', 'normal', 'fast', 'ultra'] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => updateStyle('animationSpeed', speed)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                style.animationSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Shape */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Shape</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'circle', label: 'Circle' },
              { value: 'rounded-square', label: 'Rounded' },
              { value: 'hexagon', label: 'Hexagon' },
              { value: 'octagon', label: 'Octagon' },
              { value: 'shield', label: 'Shield' },
              { value: 'diamond', label: 'Diamond' },
            ] as const
          ).map((shape) => (
            <button
              key={shape.value}
              onClick={() => updateStyle('shape', shape.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                style.shape === shape.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Particle Effects */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">Particle Effect</label>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { value: 'none', label: 'None', emoji: '❌' },
              { value: 'sparkles', label: 'Sparkles', emoji: '✨' },
              { value: 'bubbles', label: 'Bubbles', emoji: '🫧' },
              { value: 'flames', label: 'Flames', emoji: '🔥' },
              { value: 'snow', label: 'Snow', emoji: '❄️' },
              { value: 'hearts', label: 'Hearts', emoji: '💕' },
              { value: 'stars', label: 'Stars', emoji: '⭐' },
            ] as const
          ).map((effect) => (
            <button
              key={effect.value}
              onClick={() => updateStyle('particleEffect', effect.value)}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                style.particleEffect === effect.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <span>{effect.emoji}</span>
              <span>{effect.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Pulse on Hover</span>
          <div
            onClick={() => updateStyle('pulseOnHover', !style.pulseOnHover)}
            className={`h-6 w-10 rounded-full transition-colors ${
              style.pulseOnHover ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              className="mt-1 h-4 w-4 rounded-full bg-white"
              animate={{ x: style.pulseOnHover ? 22 : 4 }}
              transition={springs.snappy}
            />
          </div>
        </label>

        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Show Level Badge</span>
          <div
            onClick={() => updateStyle('showLevel', !style.showLevel)}
            className={`h-6 w-10 rounded-full transition-colors ${
              style.showLevel ? 'bg-primary-600' : 'bg-dark-600'
            }`}
          >
            <motion.div
              className="mt-1 h-4 w-4 rounded-full bg-white"
              animate={{ x: style.showLevel ? 22 : 4 }}
              transition={springs.snappy}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
