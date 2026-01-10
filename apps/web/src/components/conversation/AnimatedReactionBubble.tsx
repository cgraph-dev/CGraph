/**
 * AnimatedReactionBubble Component (Web Version)
 *
 * Advanced emoji reaction system with particle effects,
 * spring physics, and haptic feedback.
 *
 * Inspired by mobile UX but enhanced with web-specific effects.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import { useState, useCallback, useRef } from 'react';
import { motion, useSpring, useAnimation, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { cn } from '@/lib/utils';

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
// PARTICLE COMPONENT
// =============================================================================

function ReactionParticle({
  emoji,
  index,
}: {
  emoji: string;
  index: number;
}) {
  const angle = (index / 8) * Math.PI * 2;
  const distance = 40 + Math.random() * 20;

  return (
    <motion.div
      className="absolute text-lg pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.03,
        ease: 'easeOut',
      }}
    >
      {emoji}
    </motion.div>
  );
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

  // Spring animations
  const scale = useSpring(1, { stiffness: 400, damping: 15 });
  const rotateZ = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 15 });

  const controls = useAnimation();

  // Handle reaction tap
  const handlePress = useCallback(() => {
    // Haptic feedback
    HapticFeedback.medium();

    // Trigger particle explosion
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 600);

    // Bounce animation sequence
    const sequence = async () => {
      await controls.start({
        scale: [1, 1.4, 0.9, 1.1, 1],
        rotateZ: [0, -10, 10, -5, 0],
        y: [0, -15, 0],
        transition: {
          duration: 0.6,
          times: [0, 0.2, 0.5, 0.7, 1],
          ease: 'easeInOut',
        },
      });
    };

    sequence();

    // Execute callback
    onPress();
  }, [controls, onPress]);

  // Mouse enter/leave effects
  const handleMouseEnter = () => {
    scale.set(1.1);
    y.set(-3);
  };

  const handleMouseLeave = () => {
    scale.set(1);
    y.set(0);
  };

  // Dynamic styling based on state
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
            {[...Array(8)].map((_, i) => (
              <ReactionParticle key={i} emoji={reaction.emoji} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Glow effect when active */}
      {reaction.hasReacted && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0px rgba(16, 185, 129, 0)',
              '0 0 20px rgba(16, 185, 129, 0.5)',
              '0 0 0px rgba(16, 185, 129, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Emoji with bounce animation */}
      <motion.span
        className="text-lg relative z-10"
        animate={
          isPressed
            ? {
                scale: [1, 0.8, 1],
                rotateZ: [0, -15, 15, 0],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        {reaction.emoji}
      </motion.span>

      {/* Count badge */}
      {reaction.count > 1 && (
        <motion.span
          className={cn(
            'text-xs font-semibold relative z-10',
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
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}
    </motion.button>
  );
}

// =============================================================================
// REACTION PICKER COMPONENT
// =============================================================================

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👏'];

export function ReactionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-3 bg-dark-800/95 backdrop-blur-xl rounded-full border border-dark-600 shadow-2xl"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {QUICK_REACTIONS.map((emoji, index) => (
        <motion.button
          key={emoji}
          className="text-2xl p-2 hover:scale-125 active:scale-95 transition-transform"
          onClick={() => {
            HapticFeedback.light();
            onSelect(emoji);
            onClose();
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
            delay: index * 0.03,
          }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
        >
          {emoji}
        </motion.button>
      ))}

      {/* Close button */}
      <motion.button
        className="ml-2 p-2 text-gray-400 hover:text-white transition-colors"
        onClick={onClose}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>
    </motion.div>
  );
}

export default AnimatedReactionBubble;
