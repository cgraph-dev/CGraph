/**
 * Toast item component for notifications
 * @module providers/notification-provider
 */

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { GlassCard } from '@/shared/components/ui';

import { NOTIFICATION_ICONS, NOTIFICATION_COLORS, DEFAULT_NOTIFICATION_COLOR } from './constants';
import type { ToastItemProps } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * unknown.
 */
/**
 * Toast Item component.
 */
export function ToastItem({ notification, index: _index, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const colors = NOTIFICATION_COLORS[notification.type] ?? DEFAULT_NOTIFICATION_COLOR;
  const icon = NOTIFICATION_ICONS[notification.type];
  const prefersReducedMotion = useReducedMotion();

  // Auto-dismiss timer
  useEffect(() => {
    if (!notification.duration || notification.duration === 0) return;

    const startTime = Date.now();
    const { duration } = notification;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.duration, onDismiss]);

  // Standard toast rendering
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: -100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -100, scale: 0.8 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.dramatic}
      className="pointer-events-auto"
      role="alert"
      aria-live="polite"
    >
      <GlassCard
        variant="frosted"
        className={`relative overflow-hidden p-4 ${colors.bg} border ${colors.border}`}
      >
        {notification.duration && notification.duration > 0 && (
          <div className="absolute left-0 right-0 top-0 h-1 bg-white/[0.04]">
            <motion.div
              className="h-full bg-primary-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3 pt-1">
          <div className="flex-shrink-0">{icon}</div>

          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white">{notification.title}</h4>
            {notification.message && (
              <p className="mt-1 text-sm text-gray-400">{notification.message}</p>
            )}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-primary-400 hover:text-primary-300"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {notification.dismissible && (
            <motion.button
              onClick={onDismiss}
              className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <XMarkIcon className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
