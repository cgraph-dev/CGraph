/**
 * ChatBubble - Chat message bubble preview component
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
  CHAT_THEME_TO_COLOR,
} from '@/stores/customization';
import { chatBubbleAnimations, hoverAnimations } from '@/lib/animationPresets';
import type { ChatBubbleProps } from './types';

export const ChatBubble = memo(function ChatBubble({ message, isOwn, timestamp }: ChatBubbleProps) {
  // Get settings from unified store with shallow comparison
  const settings = useCustomizationStore(
    useShallow((state) => ({
      chatBubbleColor: state.chatBubbleColor,
      bubbleBorderRadius: state.bubbleBorderRadius,
      bubbleShadowIntensity: state.bubbleShadowIntensity,
      bubbleGlassEffect: state.bubbleGlassEffect,
      bubbleShowTail: state.bubbleShowTail,
      bubbleHoverEffect: state.bubbleHoverEffect,
      showTimestamps: state.showTimestamps,
      bubbleEntranceAnimation: state.bubbleEntranceAnimation,
      chatTheme: state.chatTheme,
      bubbleStyle: state.bubbleStyle,
    }))
  );

  // Determine colors - use centralized mapping
  const effectiveColorPreset = CHAT_THEME_TO_COLOR[settings.chatTheme] || settings.chatBubbleColor;
  const colors = themeColors[effectiveColorPreset];

  // Get style-specific entrance animation
  const bubbleStyleKey = settings.bubbleStyle || 'default';
  const defaultAnimation = chatBubbleAnimations['default']!;
  const getEntranceAnimation = chatBubbleAnimations[bubbleStyleKey];
  const entranceAnimation = (getEntranceAnimation ?? defaultAnimation)(isOwn, 0);

  const bubbleStyle = {
    borderRadius: settings.bubbleBorderRadius,
    boxShadow: `0 4px ${settings.bubbleShadowIntensity / 4}px rgba(0, 0, 0, ${settings.bubbleShadowIntensity / 100})`,
    background: isOwn
      ? settings.bubbleGlassEffect
        ? `linear-gradient(135deg, ${colors.primary}90, ${colors.secondary}70)`
        : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
      : settings.bubbleGlassEffect
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: settings.bubbleGlassEffect ? 'blur(10px)' : 'none',
  };

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={entranceAnimation.initial}
      animate={entranceAnimation.animate}
      transition={entranceAnimation.transition}
      whileHover={settings.bubbleHoverEffect ? hoverAnimations.lift : undefined}
    >
      <div
        className={`relative max-w-[80%] px-3 py-2 ${isOwn ? 'text-white' : 'text-white/90'}`}
        style={bubbleStyle}
      >
        <p className="text-sm">{message}</p>
        {settings.showTimestamps && timestamp && (
          <span className="mt-1 block text-right text-[10px] opacity-60">{timestamp}</span>
        )}

        {/* Bubble tail */}
        {settings.bubbleShowTail && (
          <div
            className={`absolute bottom-0 h-3 w-3 ${isOwn ? '-right-1' : '-left-1'}`}
            style={{
              background: isOwn
                ? settings.bubbleGlassEffect
                  ? `${colors.secondary}70`
                  : colors.secondary
                : settings.bubbleGlassEffect
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
              borderRadius: isOwn ? '0 0 0 8px' : '0 0 8px 0',
              transform: isOwn ? 'skewX(-15deg)' : 'skewX(15deg)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
});
