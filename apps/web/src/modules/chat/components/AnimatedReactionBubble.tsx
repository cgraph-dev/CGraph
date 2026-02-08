/**
 * AnimatedReactionBubble Component (Web Version)
 *
 * Advanced emoji reaction system with particle effects,
 * spring physics, and haptic feedback.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import { useState, useCallback, useRef } from 'react';
import { motion, useSpring, useAnimation, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { cn } from '@/lib/utils';
import { ReactionParticle } from '@/modules/chat/components/animatedReactionBubble/ReactionParticle';
import {
  SPRING_SCALE,
  SPRING_ROTATE,
  SPRING_Y,
  BOUNCE_ANIMATION,
  GLOW_ANIMATION,
  GLOW_TRANSITION,
  SHIMMER_GRADIENT,
  SHIMMER_TRANSITION,
  PARTICLE_COUNT,
  PARTICLE_DURATION_MS,
} from '@/modules/chat/components/animatedReactionBubble/constants';

// Re-export extracted pieces so existing imports keep working
export { ReactionPicker } from '@/modules/chat/components/animatedReactionBubble/ReactionPicker';

// =============================================================================
// TYPES
// =============================================================================

export interface ReactionData {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users?: string[];
}

export interface AnimatedReactionBubbleProps {
  reaction: ReactionData;
  isOwnMessage: boolean;
  onPress: () => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimatedReactionBubble({
  reaction,
  isOwnMessage,
  onPress,
  className,
}: AnimatedReactionBubbleProps) {
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const scale = useSpring(1, SPRING_SCALE);
  const rotateZ = useSpring(0, SPRING_ROTATE);
  const y = useSpring(0, SPRING_Y);
  const controls = useAnimation();

  const handlePress = useCallback(() => {
    HapticFeedback.medium();

    setShowParticles(true);
    setTimeout(() => setShowParticles(false), PARTICLE_DURATION_MS);

    controls.start(BOUNCE_ANIMATION);
    onPress();
  }, [controls, onPress]);

  const handleMouseEnter = () => {
    scale.set(1.1);
    y.set(-3);
  };

  const handleMouseLeave = () => {
    scale.set(1);
    y.set(0);
  };

  const bubbleClasses = cn(
    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full',
    'transition-all duration-200 cursor-pointer select-none',
    'border backdrop-blur-sm',
    reaction.hasReacted
      ? isOwnMessage
        ? 'bg-white/25 border-white/40 shadow-lg shadow-white/20'
        : 'bg-primary-500/20 border-primary-400/60 shadow-lg shadow-primary-500/20'
      : isOwnMessage
        ? 'bg-white/10 border-white/20 hover:bg-white/20'
        : 'bg-dark-700/80 border-dark-600/60 hover:bg-dark-600/80',
    className
  );

  return (
    <motion.button
      ref={bubbleRef}
      className={bubbleClasses}
      onClick={handlePress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      animate={controls}
      style={{ scale, rotateZ, y }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      {/* Particle explosion */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0">
            {[...Array(PARTICLE_COUNT)].map((_, i) => (
              <ReactionParticle key={i} emoji={reaction.emoji} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Glow effect when active */}
      {reaction.hasReacted && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={GLOW_ANIMATION}
          transition={GLOW_TRANSITION}
        />
      )}

      {/* Emoji with bounce animation */}
      <motion.span
        className="relative z-10 text-lg"
        animate={isPressed ? { scale: [1, 0.8, 1], rotateZ: [0, -15, 15, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {reaction.emoji}
      </motion.span>

      {/* Count badge */}
      {reaction.count > 1 && (
        <motion.span
          className={cn(
            'relative z-10 text-xs font-semibold',
            reaction.hasReacted
              ? isOwnMessage
                ? 'text-white'
                : 'text-primary-300'
              : 'text-gray-300'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {reaction.count}
        </motion.span>
      )}

      {/* Ripple effect on tap */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Shimmer effect for active reactions */}
      {reaction.hasReacted && (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-0"
            style={{ background: SHIMMER_GRADIENT }}
            animate={{ x: ['-100%', '100%'] }}
            transition={SHIMMER_TRANSITION}
          />
        </div>
      )}
    </motion.button>
  );
}

export default AnimatedReactionBubble;
