/**
 * BannerParticles component
 * @module modules/forums/components/forum-theme-renderer
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { BannerParticlesProps, Particle } from './types';

export const BannerParticles = memo(function BannerParticles({ effect }: BannerParticlesProps) {
  const particles = useMemo(() => {
    const count = effect === 'matrix' ? 30 : 20;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
  }, [effect]);

  const getParticleStyle = (particle: Particle): React.CSSProperties => {
    switch (effect) {
      case 'snow':
        return {
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px white',
        };
      case 'stars':
        return {
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 6px white, 0 0 12px white',
        };
      case 'embers':
        return {
          width: particle.size,
          height: particle.size * 1.5,
          background: 'linear-gradient(to top, #ff4500, #ff6b00, transparent)',
          borderRadius: '50%',
        };
      case 'matrix':
        return {
          width: 2,
          height: 20,
          background: 'linear-gradient(to bottom, #00ff41, transparent)',
          fontFamily: 'monospace',
        };
      case 'bubbles':
        return {
          width: particle.size * 2,
          height: particle.size * 2,
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
        };
      default:
        return {};
    }
  };

  const getAnimation = (particle: Particle) => {
    switch (effect) {
      case 'snow':
        return {
          y: ['-10%', '110%'],
          x: [0, Math.sin(particle.id) * 20],
          opacity: [0, 1, 0],
        };
      case 'stars':
        return {
          opacity: [0.3, 1, 0.3],
          scale: [0.8, 1.2, 0.8],
        };
      case 'embers':
        return {
          y: ['100%', '-10%'],
          opacity: [0, 1, 0],
        };
      case 'matrix':
        return {
          y: ['-10%', '110%'],
          opacity: [0, 1, 0],
        };
      case 'bubbles':
        return {
          y: ['100%', '-10%'],
          opacity: [0, 0.5, 0],
          scale: [0.5, 1.5],
        };
      default:
        return {};
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            ...getParticleStyle(particle),
          }}
          animate={getAnimation(particle)}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});
