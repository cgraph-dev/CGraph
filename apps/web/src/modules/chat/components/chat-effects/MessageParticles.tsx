/**
 * MessageParticles - Particle effects for messages
 */

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageEffect, MessageEffectConfig } from '@/stores/chatEffectsStore';
import type { MessageParticlesProps, Particle } from './types';
import { shouldShowParticles } from './constants';

export const MessageParticles = memo(function MessageParticles({
  effect,
  config,
}: MessageParticlesProps) {
  const particleCount = config.particleCount ?? 20;
  const color = config.color ?? '#ffffff';

  const particles = useMemo((): Particle[] => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 0.5,
    }));
  }, [particleCount]);

  const getParticleContent = useCallback((): string => {
    switch (effect) {
      case 'confetti':
        return '🎊';
      case 'hearts':
        return '❤️';
      case 'stars':
        return '⭐';
      case 'sparkle':
        return '✨';
      case 'snow':
        return '❄️';
      case 'fire':
        return '🔥';
      case 'sakura':
        return '🌸';
      case 'fireworks':
        return '🎆';
      default:
        return '•';
    }
  }, [effect]);

  const getParticleAnimation = useCallback(
    (particle: Particle) => {
      switch (effect) {
        case 'confetti':
          return {
            initial: { opacity: 1, y: 0, x: particle.x, rotate: 0 },
            animate: {
              opacity: [1, 1, 0],
              y: [0, 100, 200],
              x: particle.x + (Math.random() - 0.5) * 50,
              rotate: Math.random() * 360,
            },
          };
        case 'hearts':
        case 'stars':
        case 'sparkle':
          return {
            initial: { opacity: 0, scale: 0, y: 0 },
            animate: {
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [-20, -60],
            },
          };
        case 'snow':
          return {
            initial: { opacity: 0, y: -20 },
            animate: {
              opacity: [0, 1, 1, 0],
              y: [0, 100],
              x: [particle.x, particle.x + Math.sin(particle.id) * 20],
            },
          };
        case 'fire':
          return {
            initial: { opacity: 1, y: 0, scale: 1 },
            animate: {
              opacity: [1, 0.5, 0],
              y: [-10, -40],
              scale: [1, 0.5],
            },
          };
        default:
          return {
            initial: { opacity: 0 },
            animate: { opacity: [0, 1, 0] },
          };
      }
    },
    [effect]
  );

  if (!shouldShowParticles(effect)) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const animation = getParticleAnimation(particle);
          return (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: particle.size,
                color,
              }}
              initial={animation.initial}
              animate={animation.animate}
              exit={{ opacity: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            >
              {getParticleContent()}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
