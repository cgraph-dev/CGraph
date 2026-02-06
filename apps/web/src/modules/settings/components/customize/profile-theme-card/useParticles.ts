import { useState, useEffect } from 'react';
import { PARTICLE_CONFIGS, type ParticleType } from '@/data/profileThemes';
import type { Particle } from './types';

/**
 * Hook to generate and manage particles based on theme config.
 */
export function useParticles(
  particleType: ParticleType,
  particleCount: number | undefined,
  particleColors: string[] | undefined,
  showParticles: boolean
): Particle[] {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!showParticles || particleType === 'none') {
      setParticles([]);
      return;
    }

    const particleConfig = PARTICLE_CONFIGS[particleType];
    const count = particleCount || 10;
    const colors = particleColors || ['#ffffff'];

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size:
        particleConfig.size.min +
        Math.random() * (particleConfig.size.max - particleConfig.size.min),
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      color: colors[i % colors.length] || '#ffffff',
    }));

    setParticles(newParticles);
  }, [particleType, particleCount, particleColors, showParticles]);

  return particles;
}
