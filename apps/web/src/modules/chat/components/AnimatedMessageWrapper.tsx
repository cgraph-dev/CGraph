/**
 * AnimatedMessageWrapper Component (Web Version)
 *
 * Advanced message animation inspired by React Native but optimized for web.
 * Uses Framer Motion and GSAP for fluid, performant animations.
 *
 * Features:
 * - Mobile-inspired entrance animations
 * - Gesture-based interactions
 * - Haptic feedback simulation
 * - Advanced spring physics
 * - Particle effects on reactions
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { AnimationEngine, HapticFeedback } from '@/lib/animations/AnimationEngine';
import { springs, staggerConfigs } from '@/lib/animation-presets/presets';
import { useCustomizationStore } from '@/modules/settings/store/customization';

// =============================================================================
// TYPES
// =============================================================================

export interface AnimatedMessageWrapperProps {
  children: ReactNode;
  isOwnMessage: boolean;
  index: number;
  isNew?: boolean;
  isEditing?: boolean;
  isDeleting?: boolean;
  messageId?: string;
  onSwipeReply?: () => void;
  onLongPress?: () => void;
  enableGestures?: boolean;
}

/** Maps animation speed to stagger delay multiplier */
const SPEED_MULTIPLIERS = { slow: 2, normal: 1, fast: 0.5 } as const;

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const messageVariants = {
  initial: (isOwnMessage: boolean) => ({
    x: isOwnMessage ? 20 : -20,
    opacity: 0,
    scale: 0.97,
  }),
  animate: (custom: { index: number; speedMultiplier: number }) => ({
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      ...springs.snappy,
      delay: custom.index * staggerConfigs.fast.staggerChildren * custom.speedMultiplier,
    },
  }),
  exit: (isOwnMessage: boolean) => ({
    x: isOwnMessage ? 20 : -20,
    opacity: 0,
    scale: 0.95,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as const,
      height: { delay: 0.15, duration: 0.2 },
      marginBottom: { delay: 0.15, duration: 0.2 },
    },
  }),
  hover: {
    scale: 1.01,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.99,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimatedMessageWrapper({
  children,
  isOwnMessage,
  index,
  isNew = false,
  isEditing = false,
  isDeleting = false,
  messageId: _messageId,
  onSwipeReply,
  onLongPress,
  enableGestures = true,
}: AnimatedMessageWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const [showEditFlash, setShowEditFlash] = useState(false);

  const animationSpeed = useCustomizationStore((s) => s.animationSpeed);
  const speedMultiplier = SPEED_MULTIPLIERS[animationSpeed] ?? 1;

  // Spring physics for swipe gesture
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  // Gesture configuration
  const bind = useGesture(
    {
      onDrag: ({ movement: [mx], velocity: [vx], cancel }) => {
        if (!enableGestures) return;

        // Constrain drag to horizontal
        const constrainedX = Math.max(-80, Math.min(80, mx));
        x.set(constrainedX);

        // Show reply icon when dragging
        if (Math.abs(constrainedX) > 40) {
          setShowReplyIcon(true);
          HapticFeedback.light();
        } else {
          setShowReplyIcon(false);
        }

        // Trigger reply on significant swipe
        if (Math.abs(mx) > 80 && Math.abs(vx) > 0.5) {
          onSwipeReply?.();
          HapticFeedback.medium();
          cancel();
          x.set(0);
          setShowReplyIcon(false);
        }
      },
      onDragEnd: () => {
        // Spring back to original position
        x.set(0);
        setShowReplyIcon(false);
      },
      onMouseDown: () => {
        if (!enableGestures) return;

        // Detect long press
        const timeout = setTimeout(() => {
          setIsLongPressing(true);
          HapticFeedback.heavy();
          onLongPress?.();
        }, 500);

        const cleanup = () => {
          clearTimeout(timeout);
          setIsLongPressing(false);
        };

        document.addEventListener('mouseup', cleanup, { once: true });
      },
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        threshold: 10,
      },
    }
  );

  // Entrance animation using GSAP for new messages
  useEffect(() => {
    if (isNew && wrapperRef.current) {
      AnimationEngine.messageEnter(wrapperRef.current, isOwnMessage, index);
    }
  }, [isNew, isOwnMessage, index]);

  // Flash highlight when message is being edited
  useEffect(() => {
    if (isEditing) {
      setShowEditFlash(true);
      const timer = setTimeout(() => setShowEditFlash(false), 1500);
      return () => clearTimeout(timer);
    }
    setShowEditFlash(false);
  }, [isEditing]);

  // Get gesture handlers separately to avoid type conflicts with framer-motion
  const gestureHandlers = enableGestures ? bind() : {};

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={wrapperRef}
        className="relative touch-none select-none"
        custom={{ index, isOwnMessage, speedMultiplier }}
        variants={messageVariants}
        initial={isNew ? 'initial' : false}
        animate="animate"
        exit="exit"
        whileHover={enableGestures ? 'hover' : undefined}
        whileTap={enableGestures ? 'tap' : undefined}
        style={{
          x,
          opacity,
          scale,
          cursor: enableGestures ? 'grab' : 'default',
        }}
      >
        {/* Gesture wrapper */}
        <div {...gestureHandlers} className="contents">
          {/* Reply icon indicator */}
          <AnimatePresence>
            {showReplyIcon && (
              <motion.div
                className={`absolute top-1/2 -translate-y-1/2 ${isOwnMessage ? 'left-4' : 'right-4'}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={springs.snappy}
              >
                <svg
                  className="h-6 w-6 text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Long press visual feedback */}
          {isLongPressing && (
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl border-2 border-primary-500" />
          )}

          {/* Delete red flash overlay */}
          {isDeleting && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-red-500/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3] }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}

          {/* Edit flash highlight */}
          {showEditFlash && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-yellow-400/20"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          )}

          {/* Message content */}
          {children}

          {/* Particle effects for reactions */}
          {isNew && <MessageParticles isOwnMessage={isOwnMessage} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// MESSAGE PARTICLES
// =============================================================================

function MessageParticles({ isOwnMessage }: { isOwnMessage: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: isOwnMessage ? '90%' : '10%',
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
            x: (isOwnMessage ? -1 : 1) * (30 + Math.random() * 40),
            y: -30 - Math.random() * 40,
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default AnimatedMessageWrapper;
