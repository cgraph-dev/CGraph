/**
 * Effects Tab Component
 *
 * Visual effects, animation speed, and particle settings.
 */

import { motion } from 'framer-motion';
import { TierBadge } from '../PremiumThemeGate';

import type { EffectsTabProps } from './types';
import { EFFECT_OPTIONS } from './constants';

// =============================================================================
// COMPONENT
// =============================================================================

export function EffectsTab({
  selectedEffect,
  animationSpeed,
  particlesEnabled,
  onSelectEffect,
  onSetSpeed,
  onToggleParticles,
}: EffectsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Visual Effects</h3>
      <p className="mb-6 text-sm text-gray-400">Add special effects to enhance your experience</p>

      {/* Effect Presets */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {EFFECT_OPTIONS.map((option) => {
          const isPremium = option.tier !== 'free';

          return (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isPremium && onSelectEffect(option.value)}
              disabled={isPremium}
              className={`rounded-xl p-4 text-left transition-all ${
                selectedEffect === option.value
                  ? 'bg-primary-600/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              } ${isPremium ? 'opacity-60' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-white">{option.label}</span>
                <TierBadge tier={option.tier} />
              </div>
              <p className="text-xs text-gray-400">{option.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Animation Speed */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-400">Animation Speed</h4>
        <div className="flex gap-3">
          {(['slow', 'normal', 'fast'] as const).map((speed) => (
            <motion.button
              key={speed}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSetSpeed(speed)}
              className={`flex-1 rounded-xl px-4 py-2 text-center capitalize transition-all ${
                animationSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Particles Toggle */}
      <div className="flex items-center justify-between rounded-xl bg-dark-700 p-4">
        <div>
          <span className="font-medium text-white">Particle Effects</span>
          <p className="text-xs text-gray-400">Show floating particles in animations</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleParticles}
          className={`h-6 w-12 rounded-full transition-colors ${
            particlesEnabled ? 'bg-primary-600' : 'bg-dark-600'
          }`}
        >
          <motion.div
            animate={{ x: particlesEnabled ? 24 : 0 }}
            className="h-6 w-6 rounded-full bg-white shadow-lg"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default EffectsTab;
