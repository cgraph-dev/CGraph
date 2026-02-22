import { memo } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
} from '@/modules/settings/store/customization';

interface ChatBubbleDemoProps {
  isOwn: boolean;
  message: string;
}

export const ChatBubbleDemo = memo(function ChatBubbleDemo({
  isOwn,
  message,
}: ChatBubbleDemoProps) {
  const {
    chatBubbleColor,
    bubbleBorderRadius,
    bubbleShadowIntensity,
    bubbleGlassEffect,
    bubbleShowTail,
    bubbleEntranceAnimation,
  } = useCustomizationStore();

  const colors = themeColors[chatBubbleColor];

  const getAnimationVariants = () => {
    switch (bubbleEntranceAnimation) {
      case 'slide':
        return { initial: { x: isOwn ? 50 : -50, opacity: 0 }, animate: { x: 0, opacity: 1 } };
      case 'fade':
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
      case 'scale':
        return { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
      case 'bounce':
        return { initial: { y: 30, opacity: 0 }, animate: { y: 0, opacity: 1 } };
      case 'flip':
        return { initial: { rotateX: 90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 } };
      default:
        return { initial: { opacity: 1 }, animate: { opacity: 1 } };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={variants.initial}
      animate={variants.animate}
      transition={springs.stiff}
    >
      <div
        className={`relative max-w-[80%] px-4 py-2.5 ${isOwn ? 'text-white' : 'text-white/90'}`}
        style={{
          borderRadius: bubbleBorderRadius,
          boxShadow: `0 4px ${bubbleShadowIntensity / 4}px rgba(0, 0, 0, ${bubbleShadowIntensity / 100})`,
          background: isOwn
            ? bubbleGlassEffect
              ? `linear-gradient(135deg, ${colors.primary}90, ${colors.secondary}70)`
              : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
            : bubbleGlassEffect
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: bubbleGlassEffect ? 'blur(10px)' : 'none',
        }}
      >
        <p className="text-sm">{message}</p>

        {bubbleShowTail && (
          <div
            className={`absolute bottom-0 h-3 w-3 ${isOwn ? '-right-1' : '-left-1'}`}
            style={{
              background: isOwn
                ? bubbleGlassEffect
                  ? `${colors.secondary}70`
                  : colors.secondary
                : bubbleGlassEffect
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
