/**
 * MessageWithEffect - Message component with animation effects
 */

import { memo, useMemo, useRef } from 'react';
import { motion, type TargetAndTransition } from 'framer-motion';
import type { MessageEffect, MessageEffectConfig } from '@/stores/chatEffectsStore';
import type { MessageWithEffectProps } from './types';
import { MessageBubble } from './MessageBubble';
import { MessageParticles } from './MessageParticles';

interface AnimationVariant {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
}

const getAnimationVariants = (effect: MessageEffect, config: Partial<MessageEffectConfig>) => {
  const animationSpeed = (config as Record<string, unknown>).animationSpeed as string | undefined;
  const size = (config as Record<string, unknown>).size as string | undefined;
  const duration = animationSpeed === 'slow' ? 0.8 : animationSpeed === 'fast' ? 0.3 : 0.5;
  const scale = size === 'small' ? 0.9 : size === 'large' ? 1.1 : 1;

  const variants: Record<string, AnimationVariant> = {
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
    'fade-in': {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    'slide-in-left': {
      initial: { x: -50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -50, opacity: 0 },
    },
    'slide-in-right': {
      initial: { x: 50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 50, opacity: 0 },
    },
    'slide-in-up': {
      initial: { y: 50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 50, opacity: 0 },
    },
    'slide-in-down': {
      initial: { y: -50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -50, opacity: 0 },
    },
    zoom: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    },
    bounce: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } },
      exit: { y: 100, opacity: 0 },
    },
    shake: {
      initial: { x: 0 },
      animate: { x: [0, -10, 10, -10, 10, 0] },
      exit: { opacity: 0 },
    },
    flip: {
      initial: { rotateY: 90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: -90, opacity: 0 },
    },
    rotate: {
      initial: { rotate: -180, opacity: 0, scale: 0 },
      animate: { rotate: 0, opacity: 1, scale },
      exit: { rotate: 180, opacity: 0, scale: 0 },
    },
    pulse: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } },
      exit: { opacity: 0 },
    },
    glow: {
      initial: { boxShadow: '0 0 0 rgba(255,255,255,0)' },
      animate: { boxShadow: `0 0 20px ${config.color ?? 'rgba(255,255,255,0.5)'}` },
      exit: { boxShadow: '0 0 0 rgba(255,255,255,0)' },
    },
    glitch: {
      initial: { x: 0, filter: 'none' },
      animate: {
        x: [0, -5, 5, -2, 2, 0],
        filter: ['none', 'hue-rotate(90deg)', 'hue-rotate(180deg)', 'hue-rotate(270deg)', 'none'],
      },
      exit: { opacity: 0 },
    },
    typewriter: {
      initial: { width: 0, overflow: 'hidden' },
      animate: { width: 'auto' },
      exit: { width: 0 },
    },
    matrix: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)', color: '#00ff00' },
      exit: { opacity: 0, filter: 'blur(10px)' },
    },
    'neon-glow': {
      initial: { textShadow: 'none' },
      animate: {
        textShadow: [
          '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 30px #0ff',
          '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #f0f, 0 0 30px #f0f',
        ],
        transition: { repeat: Infinity, duration: 2, repeatType: 'reverse' },
      },
      exit: { textShadow: 'none' },
    },
    holographic: {
      initial: { background: 'none' },
      animate: {
        background: [
          'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
          'linear-gradient(135deg, #9400d3, #4b0082, #0000ff, #00ff00, #ffff00, #ff7f00, #ff0000)',
        ],
        backgroundClip: 'text',
        color: 'transparent',
        transition: { repeat: Infinity, duration: 3, repeatType: 'reverse' },
      },
      exit: { background: 'none' },
    },
    confetti: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
    },
    hearts: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    },
    stars: {
      initial: { opacity: 0, rotate: -180 },
      animate: { opacity: 1, rotate: 0 },
      exit: { opacity: 0, rotate: 180 },
    },
    sparkle: {
      initial: { opacity: 0 },
      animate: { opacity: [0, 1, 0.8, 1] },
      exit: { opacity: 0 },
    },
    rainbow: {
      initial: { filter: 'hue-rotate(0deg)' },
      animate: {
        filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
        transition: { repeat: Infinity, duration: 2 },
      },
      exit: { filter: 'hue-rotate(0deg)' },
    },
    wave: {
      initial: { y: 0 },
      animate: { y: [0, -5, 0, 5, 0], transition: { repeat: Infinity, duration: 1 } },
      exit: { y: 0 },
    },
    'elastic-in': {
      initial: { scale: 0, opacity: 0 },
      animate: { scale, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 10 } },
      exit: { scale: 0, opacity: 0 },
    },
    'spiral-in': {
      initial: { scale: 0, rotate: -720, opacity: 0 },
      animate: { scale, rotate: 0, opacity: 1 },
      exit: { scale: 0, rotate: 720, opacity: 0 },
    },
    jello: {
      initial: { transform: 'skewX(0deg) skewY(0deg)' },
      animate: {
        transform: [
          'skewX(0deg) skewY(0deg)',
          'skewX(-12.5deg) skewY(-12.5deg)',
          'skewX(6.25deg) skewY(6.25deg)',
          'skewX(-3.125deg) skewY(-3.125deg)',
          'skewX(0deg) skewY(0deg)',
        ],
      },
      exit: { transform: 'skewX(0deg) skewY(0deg)' },
    },
    rubberband: {
      initial: { scaleX: 1, scaleY: 1 },
      animate: {
        scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
        scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
      },
      exit: { scaleX: 1, scaleY: 1 },
    },
    swing: {
      initial: { rotate: 0, transformOrigin: 'top center' },
      animate: {
        rotate: [0, 15, -10, 5, -5, 0],
        transformOrigin: 'top center',
      },
      exit: { rotate: 0 },
    },
    tada: {
      initial: { scale: 1, rotate: 0 },
      animate: {
        scale: [1, 0.9, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1],
        rotate: [0, -3, -3, 3, -3, 3, -3, 3, -3, 0],
      },
      exit: { scale: 1, rotate: 0 },
    },
    wobble: {
      initial: { x: 0, rotate: 0 },
      animate: {
        x: [0, -25, 20, -15, 10, -5, 0],
        rotate: [0, -5, 3, -3, 2, -1, 0],
      },
      exit: { x: 0, rotate: 0 },
    },
    heartbeat: {
      initial: { scale: 1 },
      animate: {
        scale: [1, 1.3, 1, 1.3, 1],
        transition: { repeat: Infinity, duration: 1.3 },
      },
      exit: { scale: 1 },
    },
    'backIn-left': {
      initial: { x: -200, scale: 0.7, opacity: 0 },
      animate: { x: 0, scale: 1, opacity: 1 },
      exit: { x: -200, scale: 0.7, opacity: 0 },
    },
    'backIn-right': {
      initial: { x: 200, scale: 0.7, opacity: 0 },
      animate: { x: 0, scale: 1, opacity: 1 },
      exit: { x: 200, scale: 0.7, opacity: 0 },
    },
    'lightSpeed-left': {
      initial: { x: -100, skewX: '30deg', opacity: 0 },
      animate: { x: 0, skewX: '0deg', opacity: 1 },
      exit: { x: 100, skewX: '-30deg', opacity: 0 },
    },
    'lightSpeed-right': {
      initial: { x: 100, skewX: '-30deg', opacity: 0 },
      animate: { x: 0, skewX: '0deg', opacity: 1 },
      exit: { x: -100, skewX: '30deg', opacity: 0 },
    },
    'zoom-rotate': {
      initial: { scale: 0, rotate: -180, opacity: 0 },
      animate: { scale, rotate: 0, opacity: 1 },
      exit: { scale: 0, rotate: 180, opacity: 0 },
    },
  };

  return {
    variants: variants[effect] ?? variants.none,
    duration,
  };
};

export const MessageWithEffect = memo(function MessageWithEffect({
  children,
  effect = 'none',
  config = {},
  isOwn = false,
  className = '',
}: MessageWithEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { variants, duration } = useMemo(
    () => getAnimationVariants(effect, config),
    [effect, config]
  );

  if (effect === 'none') {
    return (
      <MessageBubble isOwn={isOwn} className={className}>
        {children}
      </MessageBubble>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.div
        initial={variants?.initial}
        animate={variants?.animate}
        exit={variants?.exit}
        transition={{ duration }}
        className={className}
      >
        <MessageBubble isOwn={isOwn}>{children}</MessageBubble>
      </motion.div>
      <MessageParticles effect={effect} config={config} containerRef={containerRef} />
    </div>
  );
});
