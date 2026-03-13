/**
 * Holographic-styled notification component.
 * @module
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTheme, NOTIFICATION_THEMES } from './constants';
import { HolographicContainer } from './holographic-container';
import type { HolographicNotificationProps, HolographicConfig } from './types';

/**
 * HolographicNotification Component
 *
 * Auto-dismissing notification with type-based theming
 */
export function HolographicNotification({
  message,
  type = 'info',
  onDismiss,
  duration = 5000,
  className,
}: HolographicNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // type assertion: theme map lookup result matches HolographicConfig colorTheme union

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const colorTheme = (NOTIFICATION_THEMES[type] ?? 'cyan') as HolographicConfig['colorTheme'];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onDismiss]);

  const theme = getTheme(colorTheme);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={cn('relative max-w-md', className)}
        >
          <HolographicContainer config={{ colorTheme }}>
            <div className="flex items-center gap-3 p-4">
              <div
                className="h-3 w-3 animate-pulse rounded-full"
                style={{
                  background: theme.accent,
                  boxShadow: `0 0 10px ${theme.accent}`,
                }}
              />
              <span style={{ color: theme.primary }}>{message}</span>
              {onDismiss && (
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="ml-auto rounded p-1 hover:bg-white/10"
                  style={{ color: theme.secondary }}
                >
                  ✕
                </button>
              )}
            </div>
          </HolographicContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HolographicNotification;
