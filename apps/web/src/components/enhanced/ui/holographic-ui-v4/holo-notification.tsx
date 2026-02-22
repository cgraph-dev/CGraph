/**
 * HoloNotification Component
 * @version 4.0.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';
import { HoloContainer } from './holo-container';

interface HoloNotificationProps {
  message: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  preset?: HoloPreset;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function HoloNotification({
  message,
  description,
  type = 'info',
  preset = 'cyan',
  duration = 5000,
  onDismiss,
  action,
  className,
}: HoloNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const theme = getTheme(preset);

  const typeColors: Record<string, string> = {
    info: theme.info,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
  };

  const color = typeColors[type];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          className={cn('relative max-w-sm', className)}
        >
          <HoloContainer preset={preset}>
            <div className="flex gap-3 p-4">
              {/* Indicator */}
              <motion.div
                className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="font-medium" style={{ color: theme.text }}>
                  {message}
                </p>
                {description && (
                  <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                    {description}
                  </p>
                )}
                {action && (
                  <button
                    onClick={action.onClick}
                    className="mt-2 text-sm font-medium hover:underline"
                    style={{ color: theme.primary }}
                  >
                    {action.label}
                  </button>
                )}
              </div>

              {/* Close button */}
              {onDismiss && (
                <motion.button
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="flex-shrink-0 rounded p-1 hover:bg-white/10"
                  style={{ color: theme.textMuted }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              )}
            </div>
          </HoloContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
