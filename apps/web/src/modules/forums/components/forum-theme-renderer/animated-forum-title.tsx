/**
 * AnimatedForumTitle component
 * @module modules/forums/components/forum-theme-renderer
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AnimatedForumTitleProps } from './types';
import { DEFAULT_COLORS } from './constants';
import { tweens } from '@/lib/animation-presets';

export const AnimatedForumTitle = memo(function AnimatedForumTitle({
  title,
  animation = 'none',
  speed = 2,
  colors = DEFAULT_COLORS,
  className,
  as: Component = 'h1',
}: AnimatedForumTitleProps) {
  const getAnimationStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'gradient':
        return {
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        };
      case 'glow':
        return {
          textShadow: `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
        };
      case 'holographic':
        return {
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent}, ${colors.secondary}, ${colors.primary})`,
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        };
      case 'neon-flicker':
        return {
          color: colors.primary,
          textShadow: `0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}, 0 0 20px ${colors.accent}`,
        };
      case 'fire':
        return {
          background: 'linear-gradient(to top, #ff4500, #ff6b00, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px #ff4500)',
        };
      case 'ice':
        return {
          background: 'linear-gradient(to bottom, #00b4d8, #90e0ef, #caf0f8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px #00b4d8)',
        };
      case 'electric':
        return {
          color: '#00f0ff',
          textShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff',
        };
      case 'matrix':
        return {
          color: '#00ff41',
          textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41',
          fontFamily: '"Share Tech Mono", monospace',
        };
      default:
        return { color: colors.primary };
    }
  };

  const getMotionProps = () => {
    const duration = speed;

    switch (animation) {
      case 'gradient':
      case 'holographic':
        return {
          animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
          transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
        };
      case 'glow':
        return {
          animate: {
            textShadow: [
              `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
              `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}, 0 0 60px ${colors.secondary}`,
              `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
            ],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'neon-flicker':
        return {
          animate: { opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1] },
          transition: { duration: duration * 0.5, repeat: Infinity },
        };
      default:
        return {};
    }
  };

  // Letter-by-letter reveal animation
  if (animation === 'letter-reveal') {
    return (
      <Component className={cn('inline-flex', className)} style={getAnimationStyles()}>
        {title.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tweens.standard, delay: i * 0.05 }}
            style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </Component>
    );
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      style={getAnimationStyles()}
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {...(getMotionProps() as Record<string, unknown>)} // safe downcast – structural boundary
    >
      <Component className="m-0">{title}</Component>
    </motion.span>
  );
});
