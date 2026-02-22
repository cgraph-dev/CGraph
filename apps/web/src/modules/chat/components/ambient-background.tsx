import { motion } from 'framer-motion';
import type { UIPreferences } from './message-bubble';

export interface AmbientBackgroundProps {
  uiPreferences: UIPreferences;
}

/**
 * AmbientBackground - Animated particle background effects
 * Optimized for performance with animation intensity control
 */
export function AmbientBackground({ uiPreferences }: AmbientBackgroundProps) {
  if (!uiPreferences.showParticles) {
    return null;
  }

  const particleCount =
    uiPreferences.animationIntensity === 'low'
      ? 5
      : uiPreferences.animationIntensity === 'medium'
        ? 10
        : 15;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.15,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.25, 0.1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default AmbientBackground;
