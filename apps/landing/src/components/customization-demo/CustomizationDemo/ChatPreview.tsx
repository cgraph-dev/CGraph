/**
 * ChatPreview Component
 *
 * Preview panel showing chat messages with current customization settings.
 *
 * @module components/landing/CustomizationDemo/ChatPreview
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DemoState } from './types';
import { themeColors } from './constants';
import { AnimatedAvatar } from './AnimatedAvatar';
import { getEffectStyles } from './effectStyles';

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
    // Hardcoded optimal defaults matching real app logic
    // IGNORING state.bubbleBorderRadius and state.bubbleShadowIntensity to ensure visibility
    let baseRadius = 18;
    let shadowIntensity = 0.15;

    switch (state.chatBubbleStyle) {
      case 'modern':
        baseRadius = 22;
        shadowIntensity = 0.25; // Stronger for modern
        break;
      case 'retro':
        baseRadius = 4;
        shadowIntensity = 1.0; // Full intensity for retro hard shadow
        break;
      case 'cloud':
        baseRadius = 20;
        shadowIntensity = 0.15;
        break;
      case 'rounded':
        baseRadius = 24;
        shadowIntensity = 0.15;
        break;
      case 'sharp':
        baseRadius = 2;
        shadowIntensity = 0.15;
        break;
      default:
        baseRadius = 18;
        shadowIntensity = 0.15;
    }

    return (isOwn: boolean) => {
      const isModern = state.chatBubbleStyle === 'modern';
      const isRetro = state.chatBubbleStyle === 'retro';
      const isGlass = state.bubbleGlassEffect || isModern;

      // Realistic Border Radius Logic
      let borderRadius = `${baseRadius}px`;
      if (state.chatBubbleStyle === 'sharp') {
        borderRadius = isOwn
          ? `${baseRadius}px ${baseRadius}px 0px ${baseRadius}px`
          : `${baseRadius}px ${baseRadius}px ${baseRadius}px 0px`;
      } else if (state.chatBubbleStyle === 'cloud') {
        borderRadius = isOwn
          ? `${baseRadius + 6}px ${baseRadius + 2}px 4px ${baseRadius + 6}px`
          : `${baseRadius + 2}px ${baseRadius + 6}px ${baseRadius + 6}px 4px`;
      } else if (isRetro) {
        borderRadius = '4px';
      } else {
        borderRadius = isOwn
          ? `${baseRadius}px ${baseRadius}px 4px ${baseRadius}px`
          : `${baseRadius}px ${baseRadius}px ${baseRadius}px 4px`;
      }

      // Background Color
      let background = isOwn
        ? `linear-gradient(145deg, ${bubbleColors.primary}, ${bubbleColors.secondary})`
        : 'rgba(55, 65, 81, 0.95)';

      if (isModern) {
        background = isOwn
          ? `linear-gradient(135deg, ${bubbleColors.primary}E6, ${bubbleColors.secondary}E6)`
          : 'rgba(255, 255, 255, 0.08)';
      } else if (isRetro) {
        background = isOwn ? bubbleColors.primary : '#1f2937'; // Slightly darker for retro incoming
      }

      // Realistic Shadows - BUFFED
      let boxShadow = isOwn
        ? `0 4px 6px rgba(0,0,0,${0.2 + shadowIntensity * 0.5})`
        : `0 2px 4px rgba(0,0,0,${0.2 + shadowIntensity * 0.5})`;

      if (isModern) {
        // Soft glowy shadow
        boxShadow = isOwn
          ? `0 8px 20px ${bubbleColors.glow}50, inset 0 1px 1px rgba(255,255,255,0.3)`
          : `0 4px 12px rgba(0,0,0,0.3)`;
      } else if (isRetro) {
        // Consistent Hard Shadow
        const offset = 4; // Fixed 4px for retro
        boxShadow = `${offset}px ${offset}px 0px rgba(0,0,0,0.6)`;
      }

      // Border
      let border = 'none';
      if (isModern) {
        border = '1px solid rgba(255, 255, 255, 0.1)';
      } else if (isRetro) {
        border = '2px solid rgba(0,0,0,1)'; // Solid black border
      }

      return {
        background,
        borderRadius,
        boxShadow,
        border,
        backdropFilter: isGlass ? 'blur(10px)' : 'none',
        fontFamily: isRetro ? '"Space Grotesk", monospace' : 'inherit',
        letterSpacing: isRetro ? '0.5px' : 'normal',
        textShadow: '0 1px 3px rgba(0,0,0,0.7)', // Strong text shadow for visibility
      };
    };
  }, [state, bubbleColors]);

  const getBubbleAnimation = (_isOwn: boolean, index: number) => {
    const delay = index * 0.05;
    const anim = state.bubbleEntranceAnimation || 'slide';

    // Standard Messaging Physics
    const snappySpring = { type: 'spring', stiffness: 400, damping: 25 };
    const gentleSpring = { type: 'spring', stiffness: 250, damping: 20 };

    const animations: Record<string, object> = {
      none: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      },
      slide: {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { delay, ...snappySpring },
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay, duration: 0.2 },
      },
      scale: {
        initial: { opacity: 0, scale: 0 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay, type: 'spring', stiffness: 350, damping: 25 },
      },
      bounce: {
        initial: { opacity: 0, scale: 0.8, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { delay, type: 'spring', stiffness: 400, damping: 15 },
      },
      flip: {
        initial: { opacity: 0, rotateX: 45, y: 10 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        transition: { delay, ...gentleSpring },
      },
    };

    return animations[anim] || animations.slide;
  };

  // Get effect-specific styles and animations
  const effectStyles = getEffectStyles(state.effect, colors, speedMultiplier);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      style={effectStyles.container}
      animate={effectStyles.containerAnimate}
      transition={effectStyles.containerTransition}
    >
      {/* Effect-specific overlay animation */}
      {effectStyles.hasOverlay && (
        <motion.div
          style={effectStyles.overlayStyle}
          animate={effectStyles.overlayAnimate}
          transition={effectStyles.overlayTransition}
        />
      )}

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
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: (3 + Math.random() * 2) * speedMultiplier,
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
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Online
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <AnimatePresence mode="popLayout">
          <div className={`space-y-${state.compactMode ? '1.5' : '2'}`}>
            {/* Message 1 (Incoming) */}
            <motion.div
              key={`msg1-${state.bubbleEntranceAnimation}-${state.chatBubbleStyle}`}
              className="group relative max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(false),
                alignSelf: 'flex-start',
                marginRight: 'auto',
                transformOrigin: 'left bottom',
              }}
              {...getBubbleAnimation(false, 0)}
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} font-normal text-white`}>
                Welcome! Your profile looks amazing.
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-right text-[10px] text-white/50">10:42 AM</span>
              )}
            </motion.div>

            {/* Message 2 (Outgoing) */}
            <motion.div
              key={`msg2-${state.bubbleEntranceAnimation}-${state.chatBubbleStyle}`}
              className="relative max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(true),
                marginLeft: 'auto',
                transformOrigin: 'right bottom',
              }}
              {...getBubbleAnimation(true, 1)}
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} font-medium text-white`}>
                Thanks! Just unlocked the Legendary tier 🎉
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-right text-[10px] text-white/70">10:43 AM</span>
              )}
            </motion.div>

            {/* Message 3 (Incoming) */}
            <motion.div
              key={`msg3-${state.bubbleEntranceAnimation}-${state.chatBubbleStyle}`}
              className="relative max-w-[85%] p-3"
              style={{
                ...getBubbleStyle(false),
                marginRight: 'auto',
                transformOrigin: 'left bottom',
              }}
              {...getBubbleAnimation(false, 2)}
            >
              <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} font-normal text-white`}>
                The customization options are clean!
              </p>
              {state.showTimestamps && (
                <span className="mt-1 block text-right text-[10px] text-white/50">10:44 AM</span>
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
