/**
 * Particle Preview Component
 *
 * Optimized component that only animates particles when shouldAnimate is true
 * This prevents 100+ concurrent animations that cause performance issues
 *
 * @module pages/customize/effects-customization
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type {
  SnowParticle,
  StarsParticle,
  BubblesParticle,
  SparklesParticle,
  ConfettiParticle,
  FirefliesParticle,
} from './types';

interface ParticlePreviewProps {
  type: string;
  shouldAnimate: boolean;
}

export const ParticlePreview = memo(function ParticlePreview({
  type,
  shouldAnimate,
}: ParticlePreviewProps) {
  // Memoize particle positions to prevent recalculation on re-render
  const snowData = useMemo(
    (): SnowParticle[] =>
      type === 'snow'
        ? Array.from({ length: 8 }, (_, i) => ({
            id: i,
            startX: Math.random() * 100,
            endX: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  const starsData = useMemo(
    (): StarsParticle[] =>
      type === 'stars'
        ? Array.from({ length: 12 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2 + Math.random(),
          }))
        : [],
    [type]
  );

  const bubblesData = useMemo(
    (): BubblesParticle[] =>
      type === 'bubbles'
        ? Array.from({ length: 6 }, (_, i) => ({
            id: i,
            size: 20 + Math.random() * 20,
            left: Math.random() * 80,
            delay: Math.random() * 3,
            duration: 4 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  const sparklesData = useMemo(
    (): SparklesParticle[] =>
      type === 'sparkles'
        ? Array.from({ length: 10 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            fontSize: 8 + Math.random() * 8,
            delay: Math.random() * 2,
            duration: 1 + Math.random(),
          }))
        : [],
    [type]
  );

  const confettiData = useMemo((): ConfettiParticle[] => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899'] as const;
    return type === 'confetti'
      ? Array.from({ length: 10 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: colors[i % colors.length]!,
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 2,
        }))
      : [];
  }, [type]);

  const firefliesData = useMemo(
    (): FirefliesParticle[] =>
      type === 'fireflies'
        ? Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
          }))
        : [],
    [type]
  );

  // GPU layer promotion styles for better performance
  const gpuStyles = {
    willChange: shouldAnimate ? 'transform, opacity' : 'auto',
    transform: 'translateZ(0)',
  } as const;

  if (type === 'none') {
    return (
      <div className="flex h-full items-center justify-center text-xs text-white/40">
        No particles
      </div>
    );
  }

  if (type === 'snow') {
    return (
      <>
        {snowData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ ...gpuStyles, left: `${p.startX}%` }}
            animate={
              shouldAnimate
                ? {
                    y: ['-10%', '110%'],
                    x: [`${p.startX}%`, `${p.endX}%`],
                    opacity: [0.3, 0.7, 0.3],
                  }
                : { y: '50%', opacity: 0.5 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'stars') {
    return (
      <>
        {starsData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ ...gpuStyles, top: `${p.top}%`, left: `${p.left}%` }}
            animate={
              shouldAnimate
                ? { opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }
                : { opacity: 0.5, scale: 1 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'bubbles') {
    return (
      <>
        {bubblesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full border-2 border-white/30"
            style={{
              ...gpuStyles,
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
            }}
            animate={shouldAnimate ? { y: ['110%', '-10%'] } : { y: '50%' }}
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'sparkles') {
    return (
      <>
        {sparklesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute text-yellow-300"
            style={{
              ...gpuStyles,
              top: `${p.top}%`,
              left: `${p.left}%`,
              fontSize: p.fontSize,
            }}
            animate={
              shouldAnimate
                ? { opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180] }
                : { opacity: 0.5, scale: 1, rotate: 0 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          >
            ✨
          </motion.div>
        ))}
      </>
    );
  }

  if (type === 'confetti') {
    return (
      <>
        {confettiData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-2 w-2 rounded-sm"
            style={{
              ...gpuStyles,
              left: `${p.left}%`,
              backgroundColor: p.color,
            }}
            animate={
              shouldAnimate
                ? {
                    y: ['-10%', '110%'],
                    rotate: [0, 360],
                    opacity: [1, 0.5],
                  }
                : { y: '50%', rotate: 0, opacity: 0.5 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  if (type === 'fireflies') {
    return (
      <>
        {firefliesData.map((p) => (
          <motion.div
            key={p.id}
            className="absolute h-2 w-2 rounded-full bg-yellow-400"
            style={{
              ...gpuStyles,
              top: `${p.top}%`,
              left: `${p.left}%`,
              boxShadow: shouldAnimate ? '0 0 8px #facc15, 0 0 16px #facc15' : 'none',
            }}
            animate={
              shouldAnimate
                ? {
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                    x: [0, 10, -10, 0],
                    y: [0, -10, 5, 0],
                  }
                : { opacity: 0.5, scale: 1 }
            }
            transition={
              shouldAnimate
                ? { duration: p.duration, repeat: Infinity, delay: p.delay }
                : { duration: 0.3 }
            }
          />
        ))}
      </>
    );
  }

  // Default fallback for other particle types - show a static preview
  return (
    <div className="flex h-full items-center justify-center">
      <SparklesIcon className="h-8 w-8 text-white/30" />
    </div>
  );
});
