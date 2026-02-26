/**
 * Border particle animation definitions.
 * @module
 */
import type { ParticleType } from '@/types/avatar-borders';
import type { ParticleColors } from './types';
import { random } from './utils';

/**
 * unknown for the social module.
 */
/**
 * Retrieves animation for type.
 *
 * @param type - The type.
 * @param index - The index position.
 * @param total - The total.
 * @param _colors - The _colors.
 * @param speed - The speed.
 * @returns The animation for type.
 */
export function getAnimationForType(
  type: ParticleType,
  index: number,
  total: number,
  _colors: ParticleColors,
  speed: number
) {
  const delay = (index / total) * 2;
  const duration = 2 / speed;

  switch (type) {
    case 'flame':
      return {
        y: [0, -15, 0],
        opacity: [1, 0.5, 1],
        scale: [1, 1.2, 1],
        transition: { duration: 0.8 / speed, repeat: Infinity, delay: delay * 0.3 },
      };
    case 'snowflake':
      return {
        y: [0, 20],
        x: [0, Math.sin(index) * 5],
        opacity: [1, 0],
        transition: { duration: 3 / speed, repeat: Infinity, delay: delay * 0.5 },
      };
    case 'bubble':
      return {
        y: [0, -20],
        opacity: [0.8, 0],
        scale: [0.5, 1.2],
        transition: { duration: 2 / speed, repeat: Infinity, delay: delay * 0.3 },
      };
    case 'sakura':
      return {
        y: [0, 30],
        x: [0, Math.sin(index * 2) * 15],
        rotate: [0, 360],
        opacity: [1, 0],
        transition: { duration: 3 / speed, repeat: Infinity, delay: delay * 0.4 },
      };
    case 'electric':
      return {
        opacity: [0, 1, 0],
        scaleY: [0.5, 1.5, 0.5],
        transition: { duration: 0.2 / speed, repeat: Infinity, delay: index * 0.05 },
      };
    case 'star':
      return {
        scale: [0.8, 1.2, 0.8],
        opacity: [0.6, 1, 0.6],
        rotate: [0, 180, 360],
        transition: { duration: duration, repeat: Infinity, delay },
      };
    case 'heart':
      return {
        y: [0, -15],
        scale: [0.8, 1.1, 0.8],
        opacity: [1, 0],
        transition: { duration: duration, repeat: Infinity, delay },
      };
    case 'pixel':
      return {
        opacity: [0.5, 1, 0.5],
        transition: { duration: 0.3 / speed, repeat: Infinity, delay: index * 0.02 },
      };
    case 'glitch':
      return {
        x: [0, random(-10, 10), 0],
        opacity: [0, 1, 0],
        transition: { duration: 0.1 / speed, repeat: Infinity, delay: random(0, 0.5) },
      };
    default:
      return {
        rotate: [0, 360],
        transition: { duration: 4 / speed, repeat: Infinity, ease: 'linear' as const, delay },
      };
  }
}
