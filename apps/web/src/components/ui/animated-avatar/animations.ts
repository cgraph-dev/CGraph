/**
 * Animation utilities for AnimatedAvatar
 * @module components/ui/animated-avatar
 */

import type { AvatarStyle, AnimationReturn } from './types';
import { ANIMATION_DURATIONS } from './constants';

/**
 * Get CSS class for avatar shape
 */
export function getShapeStyles(shape: AvatarStyle['shape']): string {
  switch (shape) {
    case 'squircle':
      return 'rounded-[43px]';
    case 'circle':
      return 'rounded-full';
    case 'rounded-square':
      return 'rounded-2xl';
    case 'hexagon':
      return 'rounded-xl [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';
    case 'octagon':
      return 'rounded-xl [clip-path:polygon(30%_0%,70%_0%,100%_30%,100%_70%,70%_100%,30%_100%,0%_70%,0%_30%)]';
    case 'shield':
      return 'rounded-t-full rounded-b-[50%]';
    case 'diamond':
      return '[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]';
    default:
      return 'rounded-[43px]';
  }
}

/**
 * Get CSS gradient for border style
 */
export function getBorderGradient(style: AvatarStyle): string {
  const { borderStyle: bs, borderColor: c1, secondaryColor: c2 } = style;

  switch (bs) {
    case 'none':
      return 'transparent';
    case 'solid':
      return c1;
    case 'gradient':
      return `linear-gradient(135deg, ${c1}, ${c2})`;
    case 'rainbow':
      return 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)';
    case 'aurora':
      return 'linear-gradient(135deg, #00ff87, #60efff, #0061ff, #60efff, #00ff87)';
    case 'plasma':
      return 'linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff, #ffff00, #ff00ff)';
    case 'cosmic':
      return 'linear-gradient(135deg, #1a1a2e, #4a148c, #311b92, #0d47a1, #1a1a2e)';
    case 'matrix':
      return 'linear-gradient(180deg, #003300, #00ff00, #003300)';
    case 'holographic':
      return 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #8a2be2, #ff0080)';
    case 'diamond':
      return 'linear-gradient(135deg, #ffffff, #e0e0e0, #ffffff, #c0c0c0, #ffffff)';
    case 'emerald':
      return 'linear-gradient(135deg, #004d00, #00ff00, #50c878, #00ff00, #004d00)';
    case 'ruby':
      return 'linear-gradient(135deg, #8b0000, #ff0000, #ff6347, #ff0000, #8b0000)';
    case 'sapphire':
      return 'linear-gradient(135deg, #000080, #0000ff, #4169e1, #0000ff, #000080)';
    case 'amethyst':
      return 'linear-gradient(135deg, #4b0082, #8b00ff, #9932cc, #8b00ff, #4b0082)';
    case 'fire':
      return 'linear-gradient(180deg, #ff4400, #ff8800, #ffcc00, #ff8800, #ff4400)';
    case 'electric':
      return 'linear-gradient(135deg, #00ffff, #0088ff, #00ffff, #ffffff, #00ffff)';
    case 'supernova':
      return 'radial-gradient(circle, #ffffff, #ffff00, #ff8800, #ff0000, #ff00ff)';
    case 'black_hole':
      return 'radial-gradient(circle, #000000, #1a0033, #330066, #1a0033, #000000)';
    case 'quantum':
      return 'linear-gradient(135deg, #00ff00, #ff00ff, #00ffff, #ffff00, #00ff00)';
    case 'void':
      return 'radial-gradient(circle, #0d0015, #1a0033, #0d0015)';
    case 'celestial':
      return 'linear-gradient(135deg, #ffd700, #ffffff, #87ceeb, #ffffff, #ffd700)';
    case 'anniversary':
      return 'linear-gradient(135deg, #ffd700, #ff69b4, #ffd700)';
    case 'founders':
      return 'linear-gradient(135deg, #00ff00, #ffd700, #00ff00)';
    case 'champion':
      return 'linear-gradient(135deg, #ffd700, #c0c0c0, #cd7f32, #ffd700)';
    default:
      return `linear-gradient(135deg, ${c1}, ${c2})`;
  }
}

/**
 * Get Framer Motion animation props for border style
 */
export function getAnimationProps(style: AvatarStyle): AnimationReturn {
  const duration = ANIMATION_DURATIONS[style.animationSpeed];
  if (!duration) return {};

  const intensity = style.glowIntensity;
  const { borderStyle: bs } = style;

  switch (bs) {
    case 'pulse':
      return {
        animate: { scale: [1, 1.03, 1], opacity: [1, 0.9, 1] },
        transition: { duration, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'spin':
    case 'rainbow':
    case 'aurora':
    case 'plasma':
    case 'holographic':
      return {
        animate: { rotate: 360 },
        transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
      };

    case 'glow':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.3}px ${style.borderColor}`,
            `0 0 ${intensity * 0.8}px ${style.borderColor}`,
            `0 0 ${intensity * 0.3}px ${style.borderColor}`,
          ],
        },
        transition: { duration, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'neon':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.2}px ${style.borderColor}, 0 0 ${intensity * 0.4}px ${style.borderColor}, inset 0 0 ${intensity * 0.1}px ${style.borderColor}`,
            `0 0 ${intensity * 0.5}px ${style.borderColor}, 0 0 ${intensity * 0.8}px ${style.borderColor}, inset 0 0 ${intensity * 0.3}px ${style.borderColor}`,
            `0 0 ${intensity * 0.2}px ${style.borderColor}, 0 0 ${intensity * 0.4}px ${style.borderColor}, inset 0 0 ${intensity * 0.1}px ${style.borderColor}`,
          ],
        },
        transition: { duration: duration * 0.7, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'fire':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.3}px #ff4400, 0 -${intensity * 0.2}px ${intensity * 0.4}px #ff6600, 0 -${intensity * 0.4}px ${intensity * 0.6}px #ff8800`,
            `0 0 ${intensity * 0.5}px #ff6600, 0 -${intensity * 0.3}px ${intensity * 0.6}px #ff8800, 0 -${intensity * 0.6}px ${intensity * 0.8}px #ffaa00`,
            `0 0 ${intensity * 0.3}px #ff4400, 0 -${intensity * 0.2}px ${intensity * 0.4}px #ff6600, 0 -${intensity * 0.4}px ${intensity * 0.6}px #ff8800`,
          ],
          filter: ['hue-rotate(0deg)', 'hue-rotate(15deg)', 'hue-rotate(0deg)'],
        },
        transition: { duration: duration * 0.4, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'electric':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.2}px #00ffff, 0 0 ${intensity * 0.4}px #0088ff`,
            `0 0 ${intensity * 0.6}px #00ffff, 0 0 ${intensity * 0.8}px #0088ff, 0 0 ${intensity * 1.2}px #ffffff`,
            `0 0 ${intensity * 0.1}px #0088ff, 0 0 ${intensity * 0.2}px #00ffff`,
            `0 0 ${intensity * 0.4}px #00ffff, 0 0 ${intensity * 0.6}px #0088ff`,
          ],
          scale: [1, 1.01, 0.99, 1],
        },
        transition: { duration: duration * 0.3, repeat: Infinity, ease: 'linear' },
      };

    case 'supernova':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.5}px #ffffff, 0 0 ${intensity}px #ffff00, 0 0 ${intensity * 1.5}px #ff8800`,
            `0 0 ${intensity}px #ffffff, 0 0 ${intensity * 1.5}px #ffff00, 0 0 ${intensity * 2}px #ff0000`,
            `0 0 ${intensity * 0.5}px #ffffff, 0 0 ${intensity}px #ffff00, 0 0 ${intensity * 1.5}px #ff8800`,
          ],
          scale: [1, 1.02, 1],
        },
        transition: { duration: duration * 0.8, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'black_hole':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.5}px #330066, inset 0 0 ${intensity * 0.3}px #000000`,
            `0 0 ${intensity}px #4b0082, inset 0 0 ${intensity * 0.5}px #1a0033`,
            `0 0 ${intensity * 0.5}px #330066, inset 0 0 ${intensity * 0.3}px #000000`,
          ],
          scale: [1, 0.98, 1],
        },
        transition: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'quantum':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.3}px #00ff00, ${intensity * 0.2}px 0 ${intensity * 0.3}px #ff00ff`,
            `0 0 ${intensity * 0.3}px #ff00ff, ${-intensity * 0.2}px 0 ${intensity * 0.3}px #00ffff`,
            `0 0 ${intensity * 0.3}px #00ffff, 0 ${intensity * 0.2}px ${intensity * 0.3}px #ffff00`,
            `0 0 ${intensity * 0.3}px #ffff00, 0 ${-intensity * 0.2}px ${intensity * 0.3}px #00ff00`,
          ],
          rotate: [0, 90, 180, 270, 360],
        },
        transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
      };

    case 'celestial':
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.5}px #ffd700, 0 0 ${intensity}px rgba(255, 255, 255, 0.5)`,
            `0 0 ${intensity}px #ffd700, 0 0 ${intensity * 1.5}px rgba(255, 255, 255, 0.8)`,
            `0 0 ${intensity * 0.5}px #ffd700, 0 0 ${intensity}px rgba(255, 255, 255, 0.5)`,
          ],
          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
        },
        transition: { duration, repeat: Infinity, ease: 'easeInOut' },
      };

    case 'diamond':
    case 'emerald':
    case 'ruby':
    case 'sapphire':
    case 'amethyst': {
      const gemColors: Record<string, string> = {
        diamond: '#ffffff',
        emerald: '#50c878',
        ruby: '#ff0000',
        sapphire: '#0000ff',
        amethyst: '#9932cc',
      };
      const gemColor = gemColors[bs] || '#ffffff';
      return {
        animate: {
          boxShadow: [
            `0 0 ${intensity * 0.3}px ${gemColor}, inset 0 0 ${intensity * 0.2}px rgba(255,255,255,0.3)`,
            `0 0 ${intensity * 0.6}px ${gemColor}, inset 0 0 ${intensity * 0.4}px rgba(255,255,255,0.5)`,
            `0 0 ${intensity * 0.3}px ${gemColor}, inset 0 0 ${intensity * 0.2}px rgba(255,255,255,0.3)`,
          ],
        },
        transition: { duration, repeat: Infinity, ease: 'easeInOut' },
      };
    }

    default:
      return {};
  }
}

/**
 * Get particle emojis for particle effect type
 */
export function getParticleEmoji(particleEffect: AvatarStyle['particleEffect']): string[] {
  switch (particleEffect) {
    case 'sparkles':
      return ['✨', '⭐', '💫'];
    case 'bubbles':
      return ['○', '◯', '●'];
    case 'flames':
      return ['🔥', '💥', '⚡'];
    case 'snow':
      return ['❄️', '❅', '❆'];
    case 'hearts':
      return ['❤️', '💕', '💖'];
    case 'stars':
      return ['⭐', '🌟', '💫'];
    default:
      return [];
  }
}
