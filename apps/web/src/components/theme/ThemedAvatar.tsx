import { motion } from 'framer-motion';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import type { UserTheme } from '@/stores/themeStore';

interface ThemedAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  userTheme?: Partial<UserTheme>; // For displaying other users' avatars with their theme
  onClick?: () => void;
  style?: React.CSSProperties;
}

const sizeMap = {
  xs: 'w-6 h-6',
  small: 'w-8 h-8',
  medium: 'w-12 h-12',
  large: 'w-16 h-16',
  xlarge: 'w-24 h-24',
};

const borderWidthMap = {
  xs: 1,
  small: 2,
  medium: 3,
  large: 4,
  xlarge: 5,
};

export function ThemedAvatar({
  src,
  alt = 'Avatar',
  size = 'medium',
  className = '',
  userTheme,
  onClick,
  style,
}: ThemedAvatarProps) {
  const currentUserTheme = useThemeStore((state) => state.theme);

  // Use provided user theme or fall back to current user's theme
  const theme = userTheme ? { ...currentUserTheme, ...userTheme } : currentUserTheme;
  const colors = THEME_COLORS[theme.avatarBorderColor];

  const borderWidth = borderWidthMap[size];
  const speedMultiplier = theme.animationSpeed === 'slow' ? 2 : theme.animationSpeed === 'fast' ? 0.5 : 1;

  // Determine border animation based on avatarBorder type
  const getBorderAnimation = () => {
    switch (theme.avatarBorder) {
      case 'none':
        return {};
      case 'static':
        return {
          boxShadow: theme.glowEnabled ? `0 0 20px ${colors.glow}` : 'none',
        };
      case 'glow':
        return {
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 25px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
        };
      case 'pulse':
        return {
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 30px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
          scale: [1, 1.05, 1],
        };
      case 'rotate':
        return {
          rotate: [0, 360],
        };
      case 'fire':
        return {
          boxShadow: [
            `0 0 15px rgba(249, 115, 22, 0.6)`,
            `0 0 30px rgba(249, 115, 22, 0.8)`,
            `0 0 15px rgba(249, 115, 22, 0.6)`,
          ],
        };
      case 'ice':
        return {
          boxShadow: [
            `0 0 15px rgba(56, 189, 248, 0.6)`,
            `0 0 30px rgba(56, 189, 248, 0.8)`,
            `0 0 15px rgba(56, 189, 248, 0.6)`,
          ],
        };
      case 'electric':
        return {
          boxShadow: [
            `0 0 15px rgba(234, 179, 8, 0.6)`,
            `0 0 35px rgba(234, 179, 8, 0.9)`,
            `0 0 15px rgba(234, 179, 8, 0.6)`,
          ],
        };
      case 'legendary':
        return {
          boxShadow: [
            `0 0 20px ${colors.primary}, 0 0 40px ${colors.secondary}`,
            `0 0 30px ${colors.primary}, 0 0 60px ${colors.secondary}`,
            `0 0 20px ${colors.primary}, 0 0 40px ${colors.secondary}`,
          ],
          rotate: [0, 5, -5, 0],
        };
      case 'mythic':
        return {
          boxShadow: [
            `0 0 25px ${colors.primary}, 0 0 50px ${colors.secondary}, inset 0 0 20px ${colors.glow}`,
            `0 0 40px ${colors.primary}, 0 0 80px ${colors.secondary}, inset 0 0 30px ${colors.glow}`,
            `0 0 25px ${colors.primary}, 0 0 50px ${colors.secondary}, inset 0 0 20px ${colors.glow}`,
          ],
          scale: [1, 1.08, 1],
          rotate: [0, 360],
        };
      default:
        return {};
    }
  };

  const animation = getBorderAnimation();
  const hasAnimation = Object.keys(animation).length > 0;

  return (
    <motion.div
      className={`relative rounded-full overflow-hidden ${sizeMap[size]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        border: theme.avatarBorder !== 'none' ? `${borderWidth}px solid ${colors.primary}` : 'none',
        ...style,
      }}
      animate={hasAnimation ? animation : undefined}
      transition={
        hasAnimation
          ? {
              duration: 2 * speedMultiplier,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {/* Particles effect for premium borders */}
      {theme.particlesEnabled && (theme.avatarBorder === 'legendary' || theme.avatarBorder === 'mythic') && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (1.5 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Avatar Image */}
      <img
        src={src || '/default-avatar.png'}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/default-avatar.png';
        }}
      />

      {/* Gradient overlay for glassmorphism effect */}
      {theme.effect === 'glassmorphism' && theme.blurEnabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      )}

      {/* Holographic effect */}
      {theme.effect === 'holographic' && (
        <motion.div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
