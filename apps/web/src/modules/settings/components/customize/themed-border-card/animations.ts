/**
 * Border Animation Functions
 *
 * Animation configurations for all 21+ border animation types
 */

import { type BorderDefinition } from '@/data/borderCollections';
import type { BorderAnimationResult } from './types';

/**
 * Helper to create typed transitions
 */
function createTransition(
  duration: number,
  repeat: number,
  ease: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' = 'easeInOut',
  repeatDelay?: number
): Record<string, unknown> {
  return {
    duration,
    repeat,
    ease,
    ...(repeatDelay !== undefined && { repeatDelay }),
  };
}

/**
 * Get border animation based on animation type
 */
export function getBorderAnimation(
  border: BorderDefinition,
  showAnimation: boolean
): BorderAnimationResult {
  if (!showAnimation) return {};

  switch (border.animationType) {
    case 'none':
      return {};

    case 'pulse':
      return {
        animate: {
          boxShadow: [
            `0 0 10px ${border.colors[0]}40`,
            `0 0 25px ${border.colors[0]}80`,
            `0 0 10px ${border.colors[0]}40`,
          ],
        },
        transition: createTransition(2, Infinity, 'easeInOut'),
      };

    case 'glow':
      return {
        animate: {
          boxShadow: [
            `0 0 15px ${border.colors[0]}60`,
            `0 0 30px ${border.colors[0]}80`,
            `0 0 15px ${border.colors[0]}60`,
          ],
        },
        transition: createTransition(3, Infinity, 'easeInOut'),
      };

    case 'rotate':
      return {
        animate: { rotate: 360 },
        transition: createTransition(8, Infinity, 'linear'),
      };

    case 'shimmer':
      return {
        animate: {
          opacity: [0.7, 1, 0.7],
          scale: [0.98, 1, 0.98],
        },
        transition: createTransition(2.5, Infinity, 'easeInOut'),
      };

    case 'rainbow':
      return {
        animate: {
          background: [
            `linear-gradient(0deg, ${border.colors.join(', ')})`,
            `linear-gradient(90deg, ${border.colors.join(', ')})`,
            `linear-gradient(180deg, ${border.colors.join(', ')})`,
            `linear-gradient(270deg, ${border.colors.join(', ')})`,
            `linear-gradient(360deg, ${border.colors.join(', ')})`,
          ],
        },
        transition: createTransition(5, Infinity, 'linear'),
      };

    case 'fire':
      return {
        animate: {
          boxShadow: [
            `0 -5px 15px ${border.colors[0]}80, 0 0 20px ${border.colors[1] || border.colors[0]}60`,
            `0 -10px 25px ${border.colors[0]}90, 0 0 30px ${border.colors[1] || border.colors[0]}70`,
            `0 -5px 15px ${border.colors[0]}80, 0 0 20px ${border.colors[1] || border.colors[0]}60`,
          ],
          y: [0, -2, 0],
        },
        transition: createTransition(0.5, Infinity, 'easeInOut'),
      };

    case 'ice':
      return {
        animate: {
          boxShadow: [
            `0 0 15px ${border.colors[0]}60, inset 0 0 10px ${border.colors[1] || border.colors[0]}30`,
            `0 0 25px ${border.colors[0]}80, inset 0 0 15px ${border.colors[1] || border.colors[0]}40`,
            `0 0 15px ${border.colors[0]}60, inset 0 0 10px ${border.colors[1] || border.colors[0]}30`,
          ],
        },
        transition: createTransition(3, Infinity, 'easeInOut'),
      };

    case 'electric':
      return {
        animate: {
          boxShadow: [
            `0 0 5px ${border.colors[0]}`,
            `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[1] || border.colors[0]}`,
            `0 0 5px ${border.colors[0]}`,
          ],
        },
        transition: createTransition(0.1, Infinity, 'linear', 0.5),
      };

    case 'void':
      return {
        animate: {
          boxShadow: [
            `inset 0 0 20px ${border.colors[0]}80`,
            `inset 0 0 40px ${border.colors[1] || border.colors[0]}60`,
            `inset 0 0 20px ${border.colors[0]}80`,
          ],
        },
        transition: createTransition(4, Infinity, 'easeInOut'),
      };

    case 'aurora':
      return {
        animate: {
          background: [
            `linear-gradient(45deg, ${border.colors.join(', ')})`,
            `linear-gradient(135deg, ${border.colors.join(', ')})`,
            `linear-gradient(225deg, ${border.colors.join(', ')})`,
            `linear-gradient(315deg, ${border.colors.join(', ')})`,
            `linear-gradient(405deg, ${border.colors.join(', ')})`,
          ],
        },
        transition: createTransition(6, Infinity, 'easeInOut'),
      };

    case 'galaxy':
      return {
        animate: {
          background: [
            `radial-gradient(circle at 30% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 70% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
            `radial-gradient(circle at 70% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 30% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
            `radial-gradient(circle at 30% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 70% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
          ],
          rotate: [0, 180, 360],
        },
        transition: createTransition(10, Infinity, 'linear'),
      };

    case 'holographic':
      return {
        animate: {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)'],
        },
        transition: createTransition(3, Infinity, 'linear'),
      };

    case 'pixel-pulse':
      return {
        animate: {
          boxShadow: [
            `0 0 0 2px ${border.colors[0]}, 0 0 0 4px transparent`,
            `0 0 0 4px ${border.colors[0]}, 0 0 0 8px ${border.colors[1] || border.colors[0]}40`,
            `0 0 0 2px ${border.colors[0]}, 0 0 0 4px transparent`,
          ],
          scale: [1, 1.02, 1],
        },
        transition: createTransition(1.5, Infinity, 'easeInOut'),
      };

    case 'scan-line':
      return {
        animate: {
          backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
        },
        style: {
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${border.colors[0]}20 2px, ${border.colors[0]}20 4px)`,
          backgroundSize: '100% 200%',
        },
        transition: createTransition(2, Infinity, 'linear'),
      };

    case 'glitch':
      return {
        animate: {
          x: [0, -2, 2, -1, 1, 0],
          y: [0, 1, -1, 0.5, -0.5, 0],
          filter: [
            'none',
            `drop-shadow(2px 0 ${border.colors[0]}) drop-shadow(-2px 0 ${border.colors[1] || '#00ffff'})`,
            'none',
            `drop-shadow(-2px 0 ${border.colors[0]}) drop-shadow(2px 0 ${border.colors[2] || '#ff00ff'})`,
            'none',
          ],
        },
        transition: createTransition(0.5, Infinity, 'linear', 2),
      };

    case 'sakura-fall':
      return {
        animate: {
          boxShadow: [
            `0 -5px 15px ${border.colors[0]}60, 5px 0 15px ${border.colors[1] || border.colors[0]}40`,
            `5px 5px 15px ${border.colors[0]}40, -5px 5px 15px ${border.colors[1] || border.colors[0]}60`,
            `0 -5px 15px ${border.colors[0]}60, 5px 0 15px ${border.colors[1] || border.colors[0]}40`,
          ],
          rotate: [0, 5, -5, 0],
        },
        transition: createTransition(4, Infinity, 'easeInOut'),
      };

    case 'wave':
      return {
        animate: {
          boxShadow: [
            `0 5px 20px ${border.colors[0]}70`,
            `0 -5px 20px ${border.colors[1] || border.colors[0]}70`,
            `0 5px 20px ${border.colors[0]}70`,
          ],
          scaleY: [1, 1.02, 1, 0.98, 1],
        },
        transition: createTransition(3, Infinity, 'easeInOut'),
      };

    case 'energy-surge':
      return {
        animate: {
          boxShadow: [
            `0 0 10px ${border.colors[0]}40, 0 0 20px ${border.colors[1] || border.colors[0]}20`,
            `0 0 30px ${border.colors[0]}80, 0 0 60px ${border.colors[1] || border.colors[0]}40, 0 0 100px ${border.colors[2] || border.colors[0]}20`,
            `0 0 10px ${border.colors[0]}40, 0 0 20px ${border.colors[1] || border.colors[0]}20`,
          ],
          scale: [1, 1.05, 1],
        },
        transition: createTransition(2, Infinity, 'easeInOut'),
      };

    case 'smoke':
      return {
        animate: {
          opacity: [0.6, 0.9, 0.6],
          filter: [
            `blur(0px) drop-shadow(0 0 10px ${border.colors[0]}60)`,
            `blur(1px) drop-shadow(0 0 20px ${border.colors[0]}80)`,
            `blur(0px) drop-shadow(0 0 10px ${border.colors[0]}60)`,
          ],
        },
        transition: createTransition(4, Infinity, 'easeInOut'),
      };

    case 'neon-flicker':
      return {
        animate: {
          opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1],
          boxShadow: [
            `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[0]}80`,
            `0 0 10px ${border.colors[0]}60, 0 0 20px ${border.colors[0]}40`,
            `0 0 25px ${border.colors[0]}, 0 0 50px ${border.colors[0]}90`,
            `0 0 15px ${border.colors[0]}80, 0 0 30px ${border.colors[0]}60`,
            `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[0]}80`,
          ],
        },
        transition: createTransition(2, Infinity, 'linear'),
      };

    default:
      return {};
  }
}
