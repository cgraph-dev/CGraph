/**
 * HoloAvatar Component
 * @module components/enhanced/ui/holographic-ui/components/avatar
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HoloAvatarProps } from '../types';
import { getTheme } from '../presets';

export function HoloAvatar({
  src,
  name,
  size = 'md',
  status,
  preset = 'cyan',
  ring = true,
  className,
}: HoloAvatarProps) {
  const theme = getTheme(preset);

  const sizeMap = {
    xs: { container: 'w-6 h-6', text: 'text-[8px]', status: 'w-1.5 h-1.5' },
    sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2' },
    md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5' },
    lg: { container: 'w-14 h-14', text: 'text-lg', status: 'w-3 h-3' },
    xl: { container: 'w-20 h-20', text: 'text-2xl', status: 'w-4 h-4' },
    '2xl': { container: 'w-28 h-28', text: 'text-3xl', status: 'w-5 h-5' },
  } as const;

  const statusColors: Record<string, string> = {
    online: theme.success,
    offline: theme.textMuted,
    away: theme.warning,
    busy: theme.error,
    invisible: theme.textMuted,
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizes = sizeMap[size];

  return (
    <div className={cn('relative inline-block', className)}>
      <motion.div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full',
          sizes.container
        )}
        style={{
          background: src ? 'transparent' : theme.surface,
          border: `2px solid ${theme.primary}`,
          boxShadow: `0 0 12px ${theme.glow}50`,
        }}
        whileHover={{ scale: 1.08 }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            style={{ filter: `drop-shadow(0 0 4px ${theme.glow})` }}
          />
        ) : (
          <span className={sizes.text} style={{ color: theme.primary, fontWeight: 600 }}>
            {initials}
          </span>
        )}

        {/* Animated ring */}
        {ring && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ border: `1px solid ${theme.accent}` }}
            animate={{ scale: [1, 1.15], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.div>

      {/* Status indicator */}
      {status && status !== 'invisible' && (
        <motion.div
          className={cn('absolute bottom-0 right-0 rounded-full', sizes.status)}
          style={{
            background: statusColors[status],
            boxShadow: `0 0 6px ${statusColors[status]}`,
            border: `2px solid ${theme.background}`,
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
