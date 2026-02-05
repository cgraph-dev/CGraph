/**
 * ChatPreview Component
 *
 * Preview panel showing chat messages with current customization settings.
 *
 * @module components/landing/CustomizationDemo/ChatPreview
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
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
    const baseRadius = state.bubbleBorderRadius || 16;
    const shadowIntensity = (state.bubbleShadowIntensity || 20) / 100;

    return (isOwn: boolean) => {
      const bgColor = isOwn
        ? `linear-gradient(135deg, ${bubbleColors.primary}, ${bubbleColors.secondary})`
        : 'rgba(55, 65, 81, 0.8)';

      let borderRadius = `${baseRadius}px`;
      if (state.chatBubbleStyle === 'sharp') {
        borderRadius = isOwn
          ? `${baseRadius}px ${baseRadius}px 4px ${baseRadius}px`
          : `${baseRadius}px ${baseRadius}px ${baseRadius}px 4px`;
      } else if (state.chatBubbleStyle === 'cloud') {
        borderRadius = `${baseRadius + 8}px`;
      }

      return {
        background: bgColor,
        borderRadius,
        boxShadow: isOwn
          ? `0 4px ${12 * shadowIntensity}px ${bubbleColors.glow}`
          : `0 2px ${8 * shadowIntensity}px rgba(0, 0, 0, 0.3)`,
        backdropFilter: state.bubbleGlassEffect ? 'blur(10px)' : 'none',
      };
    };
  }, [state, bubbleColors]);

  const getBubbleAnimation = (isOwn: boolean, index: number) => {
    const delay = index * 0.15;
    const anim = state.bubbleEntranceAnimation || 'slide';

    const animations: Record<string, object> = {
      none: {},
      slide: {
        initial: { opacity: 0, x: isOwn ? 20 : -20 },
        animate: { opacity: 1, x: 0 },
        transition: { delay, type: 'spring', stiffness: 300 },
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay, duration: 0.3 },
      },
      scale: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay, type: 'spring', stiffness: 400 },
      },
      bounce: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, type: 'spring', stiffness: 500, damping: 15 },
      },
      flip: {
        initial: { opacity: 0, rotateX: 90 },
        animate: { opacity: 1, rotateX: 0 },
        transition: { delay, type: 'spring', stiffness: 300 },
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
            size={state.avatarSize}
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

        {/* Messages */}
        <div className={`space-y-${state.compactMode ? '2' : '3'}`}>
          <motion.div
            className="p-3"
            style={getBubbleStyle(false)}
            {...getBubbleAnimation(false, 0)}
            whileHover={
              state.bubbleHoverEffect
                ? { scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30` }
                : {}
            }
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
              Welcome! Your profile looks amazing with that border! 🔥
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-gray-500">10:42 AM</span>
            )}
          </motion.div>

          <motion.div
            className="ml-auto max-w-[75%] p-3"
            style={getBubbleStyle(true)}
            {...getBubbleAnimation(true, 1)}
            whileHover={
              state.bubbleHoverEffect
                ? { scale: 1.02, boxShadow: `0 6px 20px ${bubbleColors.primary}50` }
                : {}
            }
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-white`}>
              Thanks! Just unlocked the Legendary tier 🎉
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-white/60">10:43 AM</span>
            )}
          </motion.div>

          <motion.div
            className="p-3"
            style={getBubbleStyle(false)}
            {...getBubbleAnimation(false, 2)}
            whileHover={
              state.bubbleHoverEffect
                ? { scale: 1.02, boxShadow: `0 4px 16px ${colors.primary}30` }
                : {}
            }
          >
            <p className={`${state.compactMode ? 'text-xs' : 'text-sm'} text-gray-200`}>
              The customization options are incredible! 🎨
            </p>
            {state.showTimestamps && (
              <span className="mt-1 block text-[10px] text-gray-500">10:44 AM</span>
            )}
          </motion.div>
        </div>

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
