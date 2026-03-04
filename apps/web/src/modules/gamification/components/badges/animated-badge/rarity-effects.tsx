/**
 * RarityEffects component - renders animation effects based on rarity
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'motion/react';
import type { AchievementRarity } from '@/modules/gamification/store';
import type { RarityColorConfig, SizeConfig } from './types';
import { OrbitingParticle } from './orbiting-particle';
import {
  shimmerAnimation,
  pulseGlowAnimation,
  rotatingRingAnimation,
  auroraAnimation,
  voidDistortionAnimation,
} from './animations';

interface RarityEffectsProps {
  rarity: AchievementRarity;
  colors: RarityColorConfig;
  config: SizeConfig;
}

/**
 * unknown for the gamification module.
 */
/**
 * Rarity Effects component.
 */
export function RarityEffects({ rarity, colors, config }: RarityEffectsProps) {
  switch (rarity) {
    case 'common':
      // Subtle shimmer overlay
      return (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.primary}30, transparent)`,
            backgroundSize: '200% 100%',
          }}
          animate={shimmerAnimation}
        />
      );

    case 'uncommon':
      // Pulsing glow ring
      return (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={pulseGlowAnimation(colors.glow)}
        />
      );

    case 'rare':
      // Rotating gradient ring
      return (
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: config.ring,
            height: config.ring,
            top: '50%',
            left: '50%',
            marginTop: -config.ring / 2,
            marginLeft: -config.ring / 2,
            background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
            opacity: 0.6,
          }}
          animate={rotatingRingAnimation}
        >
          {/* Inner mask */}
          <div
            className="absolute rounded-full bg-[rgb(30,32,40)]"
            style={{
              inset: 3,
            }}
          />
        </motion.div>
      );

    case 'epic':
      // Dual-layer orbiting particles
      return (
        <>
          {/* Inner orbit */}
          {Array.from({ length: config.particles }).map((_, i) => (
            <OrbitingParticle
              key={`inner-${i}`}
              index={i}
              total={config.particles}
              radius={config.badge / 2 + 4}
              color={colors.primary}
            />
          ))}
          {/* Outer orbit (reverse) */}
          {Array.from({ length: config.particles / 2 }).map((_, i) => (
            <OrbitingParticle
              key={`outer-${i}`}
              index={i}
              total={config.particles / 2}
              radius={config.badge / 2 + 12}
              color={colors.secondary}
              reverse
              delay={i * 0.2}
            />
          ))}
        </>
      );

    case 'legendary':
      // Multi-color aurora effect
      return (
        <>
          <motion.div
            className="pointer-events-none absolute inset-[-4px] overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(45deg, ${colors.primary}60, ${colors.secondary}60, #f59e0b60, ${colors.primary}60)`,
              backgroundSize: '300% 300%',
              filter: 'blur(4px)',
            }}
            animate={auroraAnimation}
          />
          {/* Pulsing outer glow */}
          <motion.div
            className="pointer-events-none absolute inset-[-8px] rounded-full"
            style={{
              boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: durations.loop.ms / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Sparkle particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <OrbitingParticle
              key={`sparkle-${i}`}
              index={i}
              total={6}
              radius={config.badge / 2 + 8}
              color="#fbbf24"
              delay={i * 0.3}
            />
          ))}
        </>
      );

    case 'mythic':
      // Reality-bending void effect
      return (
        <>
          {/* Void distortion background */}
          <motion.div
            className="pointer-events-none absolute inset-[-6px] rounded-full"
            style={{
              background: `radial-gradient(circle, transparent 30%, ${colors.primary}40 60%, ${colors.secondary}60 100%)`,
              filter: 'blur(2px)',
            }}
            animate={voidDistortionAnimation}
          />
          {/* Inner void */}
          <motion.div
            className="pointer-events-none absolute inset-[-12px] rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${colors.primary}80, transparent, ${colors.secondary}80, transparent, ${colors.primary}80)`,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* Outer void ring */}
          <motion.div
            className="pointer-events-none absolute inset-[-16px] rounded-full"
            style={{
              background: `conic-gradient(from 180deg, transparent, ${colors.primary}60, transparent, ${colors.secondary}60, transparent)`,
            }}
            animate={{
              rotate: [360, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* Particle streams */}
          {Array.from({ length: 8 }).map((_, i) => (
            <OrbitingParticle
              key={`void-${i}`}
              index={i}
              total={8}
              radius={config.badge / 2 + 14}
              color={i % 2 === 0 ? colors.primary : colors.secondary}
              reverse={i % 2 === 1}
              delay={i * 0.15}
            />
          ))}
          {/* Intense glow */}
          <motion.div
            className="pointer-events-none absolute inset-[-4px] rounded-full"
            animate={{
              boxShadow: [
                `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
                `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
                `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
              ],
            }}
            transition={{
              duration: durations.loop.ms / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      );

    default:
      return null;
  }
}
