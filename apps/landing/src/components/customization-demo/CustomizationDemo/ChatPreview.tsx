/**
 * ChatPreview Component
 *
 * Preview panel showing chat messages with current customization settings.
 *
 * @module components/landing/CustomizationDemo/ChatPreview
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// springs import removed
import type { DemoState } from './types';
import { themeColors } from './constants';
import { AnimatedAvatar } from './AnimatedAvatar';

interface ChatPreviewProps {
  state: DemoState;
  onChange?: (updates: Partial<DemoState>) => void;
}

export const ChatPreview = memo(function ChatPreview({ state }: ChatPreviewProps) {
  const colors = themeColors[state.theme];
  const bubbleColors = themeColors[state.chatBubbleColor];
  const speedMultiplier =
    state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  const getBubbleStyle = useMemo(() => {
    const baseRadius = state.bubbleBorderRadius ?? 16;
    const shadowIntensity = (state.bubbleShadowIntensity ?? 20) / 100;

    return (isOwn: boolean) => {
      const isModern = state.chatBubbleStyle === 'modern';
      const isRetro = state.chatBubbleStyle === 'retro';
      const isGlass = state.bubbleGlassEffect || isModern;

      // Dynamic Border Radius
      let borderRadius = `${baseRadius}px`;
      if (state.chatBubbleStyle === 'sharp') {
        borderRadius = isOwn
          ? `${baseRadius}px ${baseRadius}px 4px ${baseRadius}px`
          : `${baseRadius}px ${baseRadius}px ${baseRadius}px 4px`;
      } else if (state.chatBubbleStyle === 'cloud') {
        // Cloud/Puffy style logic
        borderRadius = isOwn
          ? `${baseRadius + 10}px ${baseRadius + 5}px 4px ${baseRadius + 10}px`
          : `${baseRadius + 5}px ${baseRadius + 10}px ${baseRadius + 10}px 4px`;
      } else if (isRetro) {
        borderRadius = '4px'; // Boxy
      }

      // Background Color
      let background = isOwn
        ? `linear-gradient(135deg, ${bubbleColors.primary}, ${bubbleColors.secondary})`
        : 'rgba(55, 65, 81, 0.8)';

      if (isModern) {
        background = isOwn
          ? `linear-gradient(135deg, ${bubbleColors.primary}DD, ${bubbleColors.secondary}DD)` // Higher opacity
          : 'rgba(255, 255, 255, 0.05)';
      } else if (isRetro) {
        background = isOwn ? bubbleColors.primary : '#374151';
      }

      // Shadows
      let boxShadow = isOwn
        ? `0 4px ${12 * shadowIntensity}px ${bubbleColors.glow}`
        : `0 2px ${8 * shadowIntensity}px rgba(0, 0, 0, 0.3)`;

      if (isModern) {
        boxShadow = isOwn
          ? `0 8px 32px ${bubbleColors.glow}, inset 0 0 20px rgba(255,255,255,0.1)`
          : `0 4px 16px rgba(0,0,0,0.2)`;
      } else if (isRetro) {
        const offset = 4 * (state.bubbleShadowIntensity ? state.bubbleShadowIntensity / 50 : 0.5);
        boxShadow = `${offset}px ${offset}px 0px rgba(0,0,0,0.5)`;
      }

      // Border
      let border = 'none';
      if (isModern) {
        border = '1px solid rgba(255, 255, 255, 0.15)';
      } else if (isRetro) {
        border = `2px solid ${isOwn ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.8)'}`;
      }

      return {
        background,
        borderRadius,
        boxShadow,
        border,
        backdropFilter: isGlass ? 'blur(12px)' : 'none',
        fontFamily: isRetro ? '"Space Grotesk", monospace' : 'inherit',
        letterSpacing: isRetro ? '0.5px' : 'normal',
      };
    };
  }, [state, bubbleColors]);

  const getBubbleAnimation = (isOwn: boolean, index: number) => {
    const delay = index * 0.15;
    const anim = state.bubbleEntranceAnimation || 'slide';

    // Advanced Spring Physics
    const elasticSpring = { type: 'spring', stiffness: 400, damping: 15, mass: 1 };
    const bounceSpring = { type: 'spring', stiffness: 500, damping: 12, mass: 0.8 };
    const snapSpring = { type: 'spring', stiffness: 300, damping: 20 };

    const animations: Record<string, object> = {
      none: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      },
      slide: {
        initial: { opacity: 0, x: isOwn ? 50 : -50, skewX: isOwn ? -10 : 10 },
        animate: { opacity: 1, x: 0, skewX: 0 },
        transition: { delay, ...elasticSpring },
      },
      fade: {
        initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        transition: { delay, duration: 0.5, ease: 'circOut' },
      },
      scale: {
        initial: { opacity: 0, scale: 0, rotate: isOwn ? 5 : -5, y: 20 },
        animate: { opacity: 1, scale: 1, rotate: 0, y: 0 },
        transition: { delay, ...snapSpring },
      },
      bounce: {
        initial: { opacity: 0, scale: 0.3, y: 50 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { delay, ...bounceSpring },
      },
      flip: {
        initial: { opacity: 0, rotateX: 90, z: -100, scale: 0.8 },
        animate: { opacity: 1, rotateX: 0, z: 0, scale: 1 },
        transition: { delay, type: 'spring', stiffness: 200, damping: 18 },
      },
    };

    return animations[anim] || animations.slide;
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={{
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled ? `0 0 40px ${colors.glow}` : 'none',
        perspective: '1000px', // Crucial for 3D transforms
      }}
      animate={
        state.glowEnabled
          ? {
              boxShadow: [
                `0 0 30px ${colors.glow}`,
                `0 0 50px ${colors.glow}`,
                `0 0 30px ${colors.glow}`,
              ],
            }
          : {}
      }
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {state.particlesEnabled && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className={`relative ${state.compactMode ? 'p-3' : 'p-5'}`}>
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <AnimatedAvatar
            borderType={state.avatarBorder}
            borderColor={state.avatarBorderColor}
            speedMultiplier={speedMultiplier}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">CGraph User</span>
              {state.showBadges && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: colors.primary, color: '#fff' }}
                >
                  PRO
                </span>
              )}
            </div>
            {state.showStatus && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <motion.div
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#22c55e' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Online
              </div>
            )}
          </div>
        </div>

        {/* Messages Container with 3D Perspective */}
        <AnimatePresence mode="popLayout">
          <div
            className={`space-y-${state.compactMode ? '2' : '3'}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Message 1 (Incoming) */}
            <motion.div
              key="msg1"
              className="max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(false),
                alignSelf: 'flex-start',
                marginRight: 'auto',
                transformOrigin: 'left center', // Enhance animations
              }}
              {...getBubbleAnimation(false, 0)}
              whileHover={
                state.bubbleHoverEffect
                  ? { scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30`, z: 10 }
                  : {}
              }
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
                Welcome! Your profile looks amazing with that border! 🔥
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-[10px] text-gray-400 opacity-70">10:42 AM</span>
              )}
            </motion.div>

            {/* Message 2 (Outgoing) */}
            <motion.div
              key="msg2"
              className="max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(true),
                marginLeft: 'auto', // CSS align
                transformOrigin: 'right center', // Enhance animations
              }}
              {...getBubbleAnimation(true, 1)}
              whileHover={
                state.bubbleHoverEffect
                  ? { scale: 1.02, boxShadow: `0 6px 20px ${bubbleColors.primary}50`, z: 10 }
                  : {}
              }
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-white`}>
                Thanks! Just unlocked the Legendary tier 🎉
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-[10px] text-white/70">10:43 AM</span>
              )}
            </motion.div>

            {/* Message 3 (Incoming) */}
            <motion.div
              key="msg3"
              className="max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(false),
                marginRight: 'auto',
                transformOrigin: 'left center',
              }}
              {...getBubbleAnimation(false, 2)}
              whileHover={
                state.bubbleHoverEffect
                  ? { scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30`, z: 10 }
                  : {}
              }
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
                The customization options are incredible! 🎨
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-[10px] text-gray-400 opacity-70">10:44 AM</span>
              )}
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Status bar */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span style={{ color: colors.primary }}>🔐</span> E2E Encrypted
          </span>
          <span style={{ color: colors.primary }}>Premium</span>
        </div>
      </div>
    </motion.div>
  );
});
