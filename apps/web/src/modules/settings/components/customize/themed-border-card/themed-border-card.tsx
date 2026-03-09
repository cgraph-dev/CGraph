/**
 * ThemedBorderCard Component
 *
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
 * Renders Lottie animations when a border has a lottieFile URL.
 */

import { lazy, Suspense } from 'react';
import { motion, type TargetAndTransition, type Transition } from 'motion/react';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { RARITY_COLORS, type BorderRarity } from '@/data/avatar-borders';
import type { ThemedBorderCardProps } from './types';
import { SIZE_CONFIG, PARTICLE_ANIMATION_TYPES } from './constants';
import { getBorderAnimation } from './animations';
import { CornerBrackets } from './corner-brackets';
import { ParticleEffects } from './particle-effects';
import { tweens, loop } from '@/lib/animation-presets';

// Lazy-load Lottie renderer to avoid bundling lottie-web when not needed
const LottieBorderRenderer = lazy(() =>
  import('@/lib/lottie/lottie-border-renderer').then((m) => ({ default: m.default ?? m.LottieBorderRenderer }))
);

/** Avatar size in px for each card size */
const AVATAR_PX: Record<string, number> = { sm: 48, md: 64, lg: 96 };

/**
 * Themed Border Card display component.
 */
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
  // Fallback for unknown rarity values to prevent crash
  const rarityColor = RARITY_COLORS[border.rarity as BorderRarity] ?? RARITY_COLORS.common;
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
      className={`relative ${config.container} group flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-200 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${isSelected ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/30'} border border-white/10 bg-white/[0.06]`}
      whileHover={canInteract ? { scale: 1.05, y: -2 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
    >
      {/* Corner brackets for selection */}
      {isSelected && <CornerBrackets color={border.colors[0] || '#fff'} />}

      {/* Avatar preview with animated border — Lottie or CSS fallback */}
      {border.lottieFile && showAnimation ? (
        <Suspense
          fallback={
            <div
              className={`${config.avatar} rounded-full`}
              style={{
                background: `linear-gradient(135deg, ${border.colors.join(', ')})`,
                padding: '3px',
              }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgb(30,32,40)]">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          }
        >
          <LottieBorderRenderer
            lottieUrl={border.lottieFile}
            avatarSize={Math.round((AVATAR_PX[size] ?? 64) * 0.65)}
            borderWidth={Math.round((AVATAR_PX[size] ?? 64) * 0.18)}
            fallbackColor={border.colors[0]}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgb(30,32,40)]">
              <span className="text-2xl">👤</span>
            </div>
          </LottieBorderRenderer>
        </Suspense>
      ) : (
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
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[rgb(30,32,40)]">
            <span className="text-2xl">👤</span>
          </div>

          {/* Particle effects for special borders */}
          {showParticles && <ParticleEffects colors={border.colors} />}
        </motion.div>
      )}

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

      {/* Lock badge — small corner indicator so the animated preview stays visible */}
      {!border.unlocked && (
        <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
          <LockClosedIcon className="h-3 w-3 text-white/70" />
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
          transition={loop(tweens.ambient)}
        >
          <SparklesIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
