import { motion } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import type { UserTheme } from '@/stores/themeStore';
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

  // If it's own message, use current user's theme; otherwise use provided theme
  const theme = isOwn ? currentUserTheme : (userTheme ? { ...currentUserTheme, ...userTheme } : currentUserTheme);
  const colors = THEME_COLORS[theme.chatBubbleColor];

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
      borderRadius: `${theme.bubbleBorderRadius}px`,
      boxShadow: theme.bubbleShadowIntensity > 0
        ? `0 2px ${theme.bubbleShadowIntensity / 5}px ${colors.glow}`
        : 'none',
    };

    if (theme.bubbleGlassEffect && theme.blurEnabled) {
      return {
        ...baseStyle,
        backdropFilter: 'blur(10px)',
        backgroundColor: `${colors.primary}90`,
        border: `1px solid ${colors.primary}40`,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: colors.primary,
    };
  };

  // Tail SVG component
  const BubbleTail = ({ position }: { position: 'left' | 'right' }) => {
    if (!theme.bubbleShowTail) return null;

    return (
      <svg
        className={`absolute bottom-0 ${position === 'left' ? '-left-2' : '-right-2'} w-4 h-4`}
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
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* User name (for other users' messages) */}
        {!isOwn && userName && (
          <span className="text-xs text-gray-400 mb-1 px-2">{userName}</span>
        )}

        {/* Message Bubble */}
        <motion.div
          className="relative"
          {...animation}
          whileHover={
            theme.bubbleHoverEffect
              ? { y: -2, scale: 1.02 }
              : undefined
          }
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div
            className="px-4 py-2 text-white relative"
            style={getBubbleStyle()}
          >
            {/* Message Text */}
            <p className="text-sm break-words whitespace-pre-wrap">{message}</p>

            {/* Timestamp (inside bubble) */}
            {showTimestamp && timestamp && (
              <span className="text-[10px] text-white/70 mt-1 block">
                {timestamp}
              </span>
            )}
          </div>

          {/* Bubble Tail */}
          <BubbleTail position={isOwn ? 'right' : 'left'} />

          {/* Particle effects for premium themes */}
          {theme.particlesEnabled && (theme.effect === 'neon' || theme.effect === 'cyberpunk') && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
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
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
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
          <span className="text-[10px] text-gray-500 mt-1 px-2">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
