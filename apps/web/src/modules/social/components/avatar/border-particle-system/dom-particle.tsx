/**
 * DOM-based particle rendering component.
 * @module
 */
import { memo } from 'react';
import type { DOMParticleProps } from './types';

export const DOMParticle = memo(function DOMParticle({ particle, type }: DOMParticleProps) {
  const getParticleStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      left: particle.x,
      top: particle.y,
      opacity: particle.opacity,
      transform: `rotate(${particle.rotation}deg)`,
      pointerEvents: 'none',
    };

    switch (type) {
      case 'spark':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          borderRadius: '50%',
          boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
        };
      case 'flame':
        return {
          ...base,
          width: particle.size,
          height: particle.size * 1.5,
          background: `linear-gradient(to top, ${particle.color}, orange, transparent)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          filter: 'blur(1px)',
        };
      case 'snowflake':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px rgba(255,255,255,0.8)',
        };
      case 'bubble':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: 'transparent',
          border: `1px solid ${particle.color}`,
          borderRadius: '50%',
        };
      case 'sakura':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: '#FFB7C5',
          borderRadius: '50% 0 50% 0',
        };
      case 'star':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          clipPath:
            'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        };
      case 'heart':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: '#FF6B9D',
          clipPath: 'polygon(50% 100%, 0% 35%, 25% 0%, 50% 15%, 75% 0%, 100% 35%)',
        };
      case 'electric':
        return {
          ...base,
          width: 2,
          height: particle.size,
          background: `linear-gradient(to bottom, transparent, ${particle.color}, transparent)`,
        };
      case 'pixel':
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          imageRendering: 'pixelated',
        };
      case 'glitch':
        return {
          ...base,
          width: particle.size * 3,
          height: 2,
          background: particle.color,
          mixBlendMode: 'screen',
        };
      default:
        return {
          ...base,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          borderRadius: '50%',
        };
    }
  };

  return <div style={getParticleStyle()} />;
});
