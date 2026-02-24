/**
 * Online status badge indicator.
 * @module
 */
import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets';
import {
  type OnlineStatus,
  statusConfig,
  glowColors,
  formatLastActiveLong,
} from './types';

interface OnlineStatusBadgeProps {
  status: OnlineStatus;
  lastActive?: string | null;
  className?: string;
}

export function OnlineStatusBadge({ status, lastActive, className = '' }: OnlineStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${config.bgColor} ${className}`}
    >
      <motion.span
        key={status}
        className={`h-2.5 w-2.5 ${config.color} rounded-full`}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          boxShadow:
            status === 'online'
              ? [
                  `0 0 0 0 ${glowColors.online}`,
                  `0 0 4px 1px ${glowColors.online}`,
                  `0 0 0 0 ${glowColors.online}`,
                ]
              : `0 0 0 0 transparent`,
        }}
        transition={{
          scale: springs.bouncy,
          boxShadow:
            status === 'online'
              ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 },
        }}
      />
      <span
        className={`text-sm font-medium ${
          status === 'online'
            ? 'text-green-700 dark:text-green-300'
            : status === 'idle'
              ? 'text-yellow-700 dark:text-yellow-300'
              : status === 'dnd'
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {status === 'offline' && lastActive ? formatLastActiveLong(lastActive) : config.label}
      </span>
    </div>
  );
}
