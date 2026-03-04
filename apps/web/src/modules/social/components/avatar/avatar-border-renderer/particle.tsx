/**
 * Particle - Individual particle effect component
 */

import { durations } from '@cgraph/animation-constants';
import { memo } from 'react';
import { motion } from 'motion/react';
import type { ParticleProps } from './types';
import { ANIMATION_KEYFRAMES } from './animations';

export const Particle = memo(function Particle({
  config,
  containerSize,
  index,
  total,
  colors,
}: ParticleProps) {
  const angle = (index / total) * Math.PI * 2;
  const radius = containerSize / 2 + 8;
  const startX = Math.cos(angle) * radius;
  const startY = Math.sin(angle) * radius;

  const getParticleStyle = (): React.CSSProperties => {
    switch (config.type) {
      case 'spark':
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '50%',
          boxShadow: `0 0 6px ${colors.accent}`,
        };
      case 'flame':
        return {
          width: 6,
          height: 10,
          background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        };
      case 'snowflake':
        return {
          width: 6,
          height: 6,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px rgba(255,255,255,0.8)',
        };
      case 'bubble':
        return {
          width: 8,
          height: 8,
          background: 'transparent',
          border: `1px solid ${colors.primary}`,
          borderRadius: '50%',
        };
      case 'sakura':
        return {
          width: 8,
          height: 8,
          background: '#FFB7C5',
          borderRadius: '50% 0 50% 0',
          transform: 'rotate(45deg)',
        };
      case 'star':
        return {
          width: 6,
          height: 6,
          background: colors.accent,
          clipPath:
            'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        };
      case 'heart':
        return {
          width: 8,
          height: 8,
          background: '#FF6B9D',
          clipPath: 'path("M4 1.5C2.5 0 0 1 0 3.5C0 6 4 8 4 8S8 6 8 3.5C8 1 5.5 0 4 1.5Z")',
        };
      case 'coin':
        return {
          width: 8,
          height: 8,
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          borderRadius: '50%',
          border: '1px solid #B8860B',
        };
      case 'leaf':
        return {
          width: 6,
          height: 10,
          background: '#4ADE80',
          borderRadius: '50% 0',
          transform: `rotate(${45 + index * 30}deg)`,
        };
      case 'electric':
        return {
          width: 2,
          height: 12,
          background: `linear-gradient(to bottom, transparent, ${colors.accent}, transparent)`,
          transform: `rotate(${index * 45}deg)`,
        };
      case 'rune':
        return {
          width: 10,
          height: 10,
          background: 'transparent',
          border: `1px solid ${colors.accent}`,
          borderRadius: '2px',
          transform: `rotate(45deg)`,
        };
      case 'crystal':
        return {
          width: 6,
          height: 12,
          background: `linear-gradient(to bottom, ${colors.primary}, transparent)`,
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        };
      case 'gear':
        return {
          width: 10,
          height: 10,
          background: '#8B7355',
          borderRadius: '2px',
          border: '1px solid #5D4037',
        };
      case 'pixel':
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '0',
        };
      case 'glitch':
        return {
          width: 12,
          height: 2,
          background: colors.accent,
          opacity: 0.7,
        };
      default:
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '50%',
        };
    }
  };

  const getAnimation = () => {
    switch (config.type) {
      case 'flame':
        return {
          y: [0, -15, 0],
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1],
          transition: {
            duration: durations.extended.ms / 1000 + Math.random() * 0.4,
            repeat: Infinity,
            delay: index * 0.1,
          },
        };
      case 'snowflake':
        return {
          y: [0, 20],
          x: [0, Math.sin(index) * 5],
          opacity: [1, 0],
          transition: {
            duration: durations.loop.ms / 1000 + Math.random(),
            repeat: Infinity,
            delay: index * 0.2,
          },
        };
      case 'bubble':
        return {
          y: [0, -20],
          opacity: [0.8, 0],
          scale: [0.5, 1.2],
          transition: { duration: durations.loop.ms / 1000, repeat: Infinity, delay: index * 0.3 },
        };
      case 'sakura':
        return {
          y: [0, 30],
          x: [0, Math.sin(index * 2) * 15],
          rotate: [0, 360],
          opacity: [1, 0],
          transition: { duration: durations.cinematic.ms / 1000, repeat: Infinity, delay: index * 0.4 },
        };
      case 'electric':
        return {
          opacity: [0, 1, 0],
          scaleY: [0.5, 1.5, 0.5],
          transition: { duration: durations.normal.ms / 1000, repeat: Infinity, delay: index * 0.05 },
        };
      default:
        return ANIMATION_KEYFRAMES.orbit(index, total);
    }
  };

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: '50%',
        x: startX,
        y: startY,
        ...getParticleStyle(),
      }}
      animate={getAnimation()}
    />
  );
});
