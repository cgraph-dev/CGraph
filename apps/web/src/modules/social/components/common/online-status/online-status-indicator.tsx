/**
 * Online status colored indicator dot.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/animation-presets';
import {
  type OnlineStatus,
  statusHexColors,
  glowColors,
  statusConfig,
  sizeConfig,
  formatLastActive,
} from './types';

interface OnlineStatusIndicatorProps {
  status: OnlineStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  lastActive?: string | null;
  className?: string;
}

export function OnlineStatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  lastActive,
  className = '',
}: OnlineStatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size] ?? sizeConfig.md;

  const tooltipText =
    status === 'offline' && lastActive
      ? `${config.label} - Last seen ${formatLastActive(lastActive)}`
      : config.label;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {/* Status Dot with Animated Presence, Color Crossfade & Breathing Pulse */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            className={`relative ${sizeClass.dot} rounded-full`}
            style={{ backgroundColor: statusHexColors[status] }}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              backgroundColor: statusHexColors[status],
              boxShadow:
                status === 'online'
                  ? [
                      `0 0 0 0 ${glowColors.online}`,
                      `0 0 6px 2px ${glowColors.online}`,
                      `0 0 0 0 ${glowColors.online}`,
                    ]
                  : `0 0 0 0 transparent`,
            }}
            exit={{ scale: 0 }}
            transition={{
              scale: springs.bouncy,
              backgroundColor: { duration: 0.4, ease: 'easeInOut' },
              boxShadow:
                status === 'online'
                  ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2 },
            }}
          />
        </AnimatePresence>
      </div>

      {/* Label */}
      {showLabel && (
        <span className={`${sizeClass.text} text-gray-600 dark:text-gray-400`}>{config.label}</span>
      )}
    </div>
  );
}

export default OnlineStatusIndicator;
