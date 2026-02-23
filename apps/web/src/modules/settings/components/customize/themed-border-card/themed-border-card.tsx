/**
 * ThemedBorderCard Component
 *
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
 */

import { motion, type TargetAndTransition, type Transition } from 'framer-motion';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { RARITY_COLORS, type BorderRarity } from '@/data/borderCollections';
import type { ThemedBorderCardProps } from './types';
import { SIZE_CONFIG, PARTICLE_ANIMATION_TYPES } from './constants';
import { getBorderAnimation } from './animations';
import { CornerBrackets } from './corner-brackets';
import { ParticleEffects } from './particle-effects';

export default function ThemedBorderCard({
  border,
  isSelected,
  onSelect,
  showAnimation = true,
  size = 'md',
  allowPreview = true,
}: ThemedBorderCardProps) {
  const config = SIZE_CONFIG[size];
  // type assertion: border.rarity is a valid BorderRarity value from API
  const rarityColor = RARITY_COLORS[border.rarity as BorderRarity];
  const isLocked = !border.unlocked && !allowPreview;
  const canInteract = !isLocked;

  const borderAnimation = getBorderAnimation(border, showAnimation);
  const showParticles =
    showAnimation &&
    PARTICLE_ANIMATION_TYPES.includes(
      border.animationType as (typeof PARTICLE_ANIMATION_TYPES)[number] // safe downcast – data-driven animation type
    );

  return (
    <motion.button
      onClick={() => canInteract && onSelect()}
      className={`relative ${config.container} group flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-200 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${isSelected ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/30'} border border-white/10 bg-dark-800/80`}
      whileHover={canInteract ? { scale: 1.05, y: -2 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
    >
      {/* Corner brackets for selection */}
      {isSelected && <CornerBrackets color={border.colors[0] || '#fff'} />}

      {/* Avatar preview with animated border */}
      <motion.div
        className={`${config.avatar} relative overflow-visible rounded-full`}
        style={{
          background: `linear-gradient(135deg, ${border.colors.join(', ')})`,
          padding: '3px',
          ...borderAnimation.style,
        }}
        animate={
          borderAnimation.animate as TargetAndTransition /* safe downcast – framer-motion typing */
        }
        transition={
          borderAnimation.transition as Transition /* safe downcast – framer-motion typing */
        }
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-dark-900">
          <span className="text-2xl">👤</span>
        </div>

        {/* Particle effects for special borders */}
        {showParticles && <ParticleEffects colors={border.colors} />}
      </motion.div>

      {/* Border name */}
      <span className={`${config.text} w-full truncate text-center font-medium text-gray-300`}>
        {border.name}
      </span>

      {/* Rarity badge */}
      <div
        className={`${config.badge} rounded-full py-0.5 font-semibold uppercase tracking-wider ${rarityColor.bg} ${rarityColor.text}`}
      >
        {border.rarity}
      </div>

      {/* Lock overlay */}
      {!border.unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 backdrop-blur-[1px]">
          <LockClosedIcon className="mb-1 h-6 w-6 text-white/70" />
          {border.unlockRequirement && (
            <span className="px-2 text-center text-[9px] leading-tight text-white/60">
              {border.unlockRequirement}
            </span>
          )}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && border.unlocked && (
        <motion.div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: border.colors[0] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}

      {/* Premium indicator */}
      {border.isPremium && border.unlocked && (
        <motion.div
          className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SparklesIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
