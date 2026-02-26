/**
 * Profile theme card visual effects.
 * @module
 */
import { motion, type MotionValue } from 'framer-motion';
import type { ProfileThemeConfig } from '@/data/profileThemes';
import type { Particle } from './types';
import { getOverlayStyles, getParticleAnimation } from './useThemeEffects';

interface ThemeEffectsProps {
  theme: ProfileThemeConfig;
  particles: Particle[];
  showParticles: boolean;
  isHovered: boolean;
  shineX: MotionValue<string>;
  shineY: MotionValue<string>;
}

/**
 * Theme Effects component.
 */
export default function ThemeEffects({
  theme,
  particles,
  showParticles,
  isHovered,
  shineX,
  shineY,
}: ThemeEffectsProps) {
  return (
    <>
      {/* Overlay effect */}
      {theme.overlayType !== 'none' && (
        <div className="pointer-events-none absolute inset-0" style={getOverlayStyles(theme)} />
      )}

      {/* Particles */}
      {showParticles && particles.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              animate={getParticleAnimation(particle, theme.particleType)}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Glow effect */}
      {theme.glowEnabled && isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.glowColor}30, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: theme.glowIntensity || 0.5 }}
        />
      )}

      {/* Holographic shine on hover */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(
              135deg,
              transparent 0%,
              rgba(255,255,255,0.1) 45%,
              rgba(255,255,255,0.3) 50%,
              rgba(255,255,255,0.1) 55%,
              transparent 100%
            )`,
            x: shineX,
            y: shineY,
          }}
        />
      )}
    </>
  );
}
