/**
 * ReactionAnimation - Animated reaction effects
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ReactionAnimationProps } from './types';

export const ReactionAnimation = memo(function ReactionAnimation({
  emoji,
  animation = 'pop',
  size = 'medium',
  onComplete,
  className = '',
}: ReactionAnimationProps) {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };
  const fontSize = sizeMap[size];

  const animationVariants = useMemo(() => {
    const variants: Record<string, { initial: object; animate: object; exit?: object }> = {
      pop: {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: [0, 1.3, 1],
          opacity: [0, 1, 1],
        },
        exit: { scale: 0, opacity: 0 },
      },
      bounce: {
        initial: { y: 20, opacity: 0 },
        animate: {
          y: [20, -10, 0],
          opacity: 1,
        },
        exit: { y: -20, opacity: 0 },
      },
      float: {
        initial: { y: 0, opacity: 1 },
        animate: {
          y: -50,
          opacity: [1, 1, 0],
        },
      },
      explode: {
        initial: { scale: 0, rotate: 0 },
        animate: {
          scale: [0, 1.5, 1],
          rotate: [0, 180, 360],
        },
        exit: { scale: 2, opacity: 0 },
      },
      spin: {
        initial: { rotate: 0, scale: 0 },
        animate: {
          rotate: [0, 360, 720],
          scale: [0, 1, 1],
        },
        exit: { rotate: 1080, scale: 0, opacity: 0 },
      },
      shake: {
        initial: { x: 0, opacity: 0 },
        animate: {
          x: [0, -5, 5, -5, 5, 0],
          opacity: 1,
        },
        exit: { opacity: 0 },
      },
      glow: {
        initial: { filter: 'brightness(1)', scale: 0 },
        animate: {
          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'],
          scale: 1,
        },
        exit: { filter: 'brightness(3)', scale: 0, opacity: 0 },
      },
      rainbow: {
        initial: { filter: 'hue-rotate(0deg)', scale: 0 },
        animate: {
          filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)'],
          scale: 1,
        },
        exit: { scale: 0, opacity: 0 },
      },
    };

    return variants[animation] ?? variants.pop;
  }, [animation]);

  const getDuration = () => {
    switch (animation) {
      case 'float':
        return 1.5;
      case 'explode':
      case 'spin':
        return 0.8;
      case 'rainbow':
        return 1.2;
      default:
        return 0.5;
    }
  };

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize }}
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={{
        duration: getDuration(),
        ease: 'easeOut',
      }}
      onAnimationComplete={onComplete}
    >
      {emoji}
    </motion.div>
  );
});
