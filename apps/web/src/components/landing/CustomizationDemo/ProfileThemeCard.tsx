/**
 * ProfileThemeCard Component
 *
 * Displays a single profile theme option with tier badge and hover effects.
 *
 * @module components/landing/CustomizationDemo/ProfileThemeCard
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileThemeConfig } from './types';
import { springs } from '@/lib/animation-presets/presets';

interface ProfileThemeCardProps {
  theme: ProfileThemeConfig;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  delay: number;
}

export const ProfileThemeCard = memo(function ProfileThemeCard({
  theme,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  delay,
}: ProfileThemeCardProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return '#ec4899';
      case 'premium':
        return '#8b5cf6';
      default:
        return '#10b981';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'ELITE';
      case 'premium':
        return 'PRO';
      default:
        return 'FREE';
    }
  };

  const getParticleSymbol = (type: string) => {
    const symbols: Record<string, string> = {
      pixel: '■',
      neon: '◆',
      petal: '❀',
      stars: '★',
      energy: '⚡',
      hearts: '♥',
      sparkles: '✦',
      snowflake: '❄',
      fire: '🔥',
      default: '●',
    };
    return symbols[type] || symbols.default;
  };

  return (
    <motion.button
      className={`group relative aspect-square w-full overflow-hidden rounded-lg border ${
        isSelected ? 'border-emerald-400' : 'border-white/20'
      }`}
      style={{
        background: `linear-gradient(135deg, ${theme.background.colors.join(', ')})`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, ...springs.bouncy }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Tier badge */}
      <div
        className="absolute left-1 top-1 z-10 rounded px-1 py-0.5 text-[8px] font-bold"
        style={{
          backgroundColor: `${getTierColor(theme.tier)}20`,
          color: getTierColor(theme.tier),
        }}
      >
        {getTierLabel(theme.tier)}
      </div>

      {/* Theme icon */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl">{theme.icon}</div>

      {/* Particle effect */}
      {theme.effects.particles && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: Math.min(theme.effects.particles.count, 6) }).map((_, i) => {
            const startX = Math.random() * 100;
            const particleType = theme.effects.particles?.type || 'pixel';

            return (
              <motion.div
                key={i}
                className="absolute text-[8px] opacity-60"
                style={{
                  left: `${startX}%`,
                  color: theme.effects.glow || '#fff',
                  textShadow: `0 0 4px ${theme.effects.glow || '#fff'}`,
                }}
                initial={{ top: '100%', opacity: 0 }}
                animate={{
                  top: '-10%',
                  opacity: [0, 0.8, 0],
                  x: Math.random() * 20 - 10,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'linear',
                }}
              >
                {getParticleSymbol(particleType)}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-lg border-2 border-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springs.default}
        />
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="pointer-events-none absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 translate-y-full rounded-lg border border-white/10 bg-gray-900/95 px-2 py-1.5 backdrop-blur-sm"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-white">{theme.name}</div>
              <div
                className="mt-1 text-[9px] font-bold"
                style={{ color: getTierColor(theme.tier) }}
              >
                {getTierLabel(theme.tier)} TIER
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
