import { motion } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useChatCustomization } from '@/stores/unifiedCustomizationStore';
import { useChatBubbleStore } from '@/stores/theme';
import type { UserTheme } from '@/stores/theme';
import { ThemedAvatar } from './ThemedAvatar';

interface ThemedChatBubbleProps {
  message: string;
  timestamp?: string;
  isOwn: boolean; // true if message is from current user
  userTheme?: Partial<UserTheme>; // Other user's theme for their messages
  userName?: string;
  userAvatar?: string | null;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export function ThemedChatBubble({
  message,
  timestamp,
  isOwn,
  userTheme,
  userName,
  userAvatar,
  showAvatar = true,
  showTimestamp = true,
  className = '',
}: ThemedChatBubbleProps) {
  const currentUserTheme = useThemeStore((state) => state.theme);
  const { chat } = useChatCustomization();
  const { style: bubbleStyle } = useChatBubbleStore();

  // If it's own message, use current user's theme; otherwise use provided theme
  const theme = isOwn
    ? currentUserTheme
    : userTheme
      ? { ...currentUserTheme, ...userTheme }
      : currentUserTheme;
  const colors = THEME_COLORS[theme.chatBubbleColor];

  // Unified customization overrides (cross-device)
  const unifiedBubbleColor = chat.bubbleColor;
  const unifiedTextColor = chat.textColor;
  const unifiedRadius = chat.bubbleRadius;
  const unifiedOpacity = chat.bubbleOpacity;

  // Local UI-only overrides (per-device)
  const localBubbleColor = isOwn ? bubbleStyle.ownMessageBg : bubbleStyle.otherMessageBg;
  const localTextColor = isOwn ? bubbleStyle.ownMessageText : bubbleStyle.otherMessageText;
  const localRadius = bubbleStyle.borderRadius;

  const resolvedBubbleColor = unifiedBubbleColor ?? localBubbleColor ?? colors.primary;
  const resolvedTextColor = unifiedTextColor ?? localTextColor ?? '#ffffff';
  const resolvedRadius = unifiedRadius ?? localRadius ?? theme.bubbleBorderRadius;
  const resolvedOpacity = unifiedOpacity ?? 100;

  const shadowIntensityMap: Record<string, number> = {
    none: 0,
    light: 10,
    medium: 20,
    strong: 40,
  };
  const resolvedShadowIntensity =
    shadowIntensityMap[chat.bubbleShadow || 'medium'] ?? theme.bubbleShadowIntensity;

  const applyOpacity = (color: string, opacity: number) => {
    const clamped = Math.min(100, Math.max(0, opacity));
    // Only append alpha for 6-digit hex colors
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      const alpha = Math.round((clamped / 100) * 255)
        .toString(16)
        .padStart(2, '0');
      return `${color}${alpha}`;
    }
    return color;
  };

  // Entrance animation props
  const getEntranceAnimation = () => {
    switch (theme.bubbleEntranceAnimation) {
      case 'slide':
        return {
          initial: { x: isOwn ? 50 : -50, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 },
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
        };
      case 'bounce':
        return {
          initial: { y: -20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { type: 'spring' as const, stiffness: 500, damping: 20 },
        };
      case 'flip':
        return {
          initial: { rotateX: 90, opacity: 0 },
          animate: { rotateX: 0, opacity: 1 },
          transition: { duration: 0.4 },
        };
      default:
        return {};
    }
  };

  const animation = getEntranceAnimation();

  // Bubble shape styles
  const getBubbleStyle = () => {
    const baseStyle: React.CSSProperties = {
      borderRadius: `${resolvedRadius}px`,
      boxShadow:
        resolvedShadowIntensity > 0
          ? `0 2px ${resolvedShadowIntensity / 5}px ${colors.glow}`
          : 'none',
      color: resolvedTextColor,
    };

    if (theme.bubbleGlassEffect && theme.blurEnabled) {
      return {
        ...baseStyle,
        backdropFilter: 'blur(10px)',
        backgroundColor: applyOpacity(resolvedBubbleColor, resolvedOpacity),
        border: `1px solid ${applyOpacity(resolvedBubbleColor, 25)}`,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: resolvedBubbleColor,
    };
  };

  // Tail SVG component
  const BubbleTail = ({ position }: { position: 'left' | 'right' }) => {
    if (!theme.bubbleShowTail) return null;

    return (
      <svg
        className={`absolute bottom-0 ${position === 'left' ? '-left-2' : '-right-2'} h-4 w-4`}
        viewBox="0 0 20 20"
        style={{ fill: theme.bubbleGlassEffect ? `${colors.primary}90` : colors.primary }}
      >
        {position === 'left' ? (
          <path d="M0,20 L20,20 L20,0 Q10,10 0,20 Z" />
        ) : (
          <path d="M20,20 L0,20 L0,0 Q10,10 20,20 Z" />
        )}
      </svg>
    );
  };

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${className}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <ThemedAvatar
            src={userAvatar}
            alt={userName || 'User'}
            size="small"
            userTheme={isOwn ? undefined : userTheme}
          />
        </div>
      )}

      {/* Message Container */}
      <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* User name (for other users' messages) */}
        {!isOwn && userName && <span className="mb-1 px-2 text-xs text-gray-400">{userName}</span>}

        {/* Message Bubble */}
        <motion.div
          className="relative"
          {...animation}
          whileHover={theme.bubbleHoverEffect ? { y: -2, scale: 1.02 } : undefined}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="relative px-4 py-2 text-white" style={getBubbleStyle()}>
            {/* Message Text */}
            <p className="whitespace-pre-wrap break-words text-sm">{message}</p>

            {/* Timestamp (inside bubble) */}
            {showTimestamp && timestamp && (
              <span className="mt-1 block text-[10px] text-white/70">{timestamp}</span>
            )}
          </div>

          {/* Bubble Tail */}
          <BubbleTail position={isOwn ? 'right' : 'left'} />

          {/* Particle effects for premium themes */}
          {theme.particlesEnabled && (theme.effect === 'neon' || theme.effect === 'cyberpunk') && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full"
                  style={{
                    background: colors.secondary,
                    left: `${20 + i * 30}%`,
                    top: '50%',
                  }}
                  animate={{
                    y: [-5, 5, -5],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Holographic shine effect */}
          {theme.effect === 'holographic' && (
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
                borderRadius: `${theme.bubbleBorderRadius}px`,
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </motion.div>

        {/* Timestamp (outside bubble) */}
        {showTimestamp && timestamp && theme.bubbleShowTail && (
          <span className="mt-1 px-2 text-[10px] text-gray-500">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
