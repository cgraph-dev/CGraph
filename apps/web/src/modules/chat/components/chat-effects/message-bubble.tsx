/**
 * MessageBubble - Styled message bubble with animation
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useActiveBubbleStyle, useChatEffectSettings } from '@/modules/chat/store';
import type { MessageBubbleProps } from './types';
import { springs } from '@/lib/animation-presets/presets';

export const MessageBubble = memo(function MessageBubble({
  children,
  style: propStyle,
  isOwn = false,
  className,
  animate = true,
}: MessageBubbleProps) {
  const storeStyle = useActiveBubbleStyle();
  const { reduceMotion } = useChatEffectSettings();
  const style = propStyle ?? storeStyle;

  const bubbleStyle = useMemo((): React.CSSProperties => {
    if (!style) return {};

    const base: React.CSSProperties = {
      backgroundColor: style.gradient ? undefined : style.backgroundColor,
      color: style.textColor,
      borderRadius: style.borderRadius ?? '1rem',
      border: style.borderColor
        ? `${style.borderWidth ?? 1}px solid ${style.borderColor}`
        : undefined,
      boxShadow:
        style.shadow ?? (style.glow ? `0 0 ${style.glow.blur}px ${style.glow.color}` : undefined),
    };

    if (style.gradient) {
      base.background = `linear-gradient(${style.gradient.angle}deg, ${style.gradient.from}, ${style.gradient.to})`;
    }

    return base;
  }, [style]);

  const variants = {
    initial: reduceMotion ? {} : { opacity: 0, scale: 0.9, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9 },
  };

  return (
    <motion.div
      className={cn('max-w-[80%] px-4 py-2', isOwn ? 'ml-auto' : 'mr-auto', className)}
      style={bubbleStyle}
      variants={animate ? variants : undefined}
      initial={animate ? 'initial' : undefined}
      animate={animate ? 'animate' : undefined}
      exit={animate ? 'exit' : undefined}
      transition={springs.bouncy}
    >
      {children}
    </motion.div>
  );
});
