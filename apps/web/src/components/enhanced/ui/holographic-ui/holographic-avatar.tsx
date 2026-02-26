/**
 * Holographic-styled avatar component.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTheme, STATUS_COLORS } from './constants';
import type { HolographicAvatarProps } from './types';

/**
 * HolographicAvatar Component
 *
 * Avatar with holographic ring animation and status indicator
 */
export function HolographicAvatar({
  src,
  name,
  size = 'md',
  status,
  colorTheme = 'cyan',
  className,
}: HolographicAvatarProps) {
  const theme = getTheme(colorTheme);

  const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative', className)}>
      <motion.div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full',
          sizeClasses[size]
        )}
        style={{
          background: src ? 'transparent' : theme.background,
          border: `2px solid ${theme.primary}`,
          boxShadow: `
            0 0 10px ${theme.glow},
            inset 0 0 15px ${theme.glow}
          `,
        }}
        whileHover={{ scale: 1.1 }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            style={{
              filter: `drop-shadow(0 0 5px ${theme.glow})`,
            }}
          />
        ) : (
          <span style={{ color: theme.primary }}>{initials}</span>
        )}

        {/* Holographic ring animation */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${theme.accent}`,
          }}
          animate={{
            scale: [1, 1.2],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      {/* Status indicator */}
      {status && (
        <motion.div
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full"
          style={{
            background: STATUS_COLORS[status],
            boxShadow: `0 0 8px ${STATUS_COLORS[status]}`,
            border: `2px solid ${theme.background}`,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: durations.loop.ms / 1000,
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );
}

export default HolographicAvatar;
