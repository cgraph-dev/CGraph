/**
 * TimerCountdown
 *
 * Displays a countdown to the secret chat session expiry.
 * Updates every second and shows time remaining in a compact format.
 *
 * @module modules/secret-chat/components/TimerCountdown
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

/** Props for the TimerCountdown component */
export interface TimerCountdownProps {
  /** ISO 8601 timestamp for session expiry */
  expiresAt: string;
  /** Callback fired when the timer reaches zero */
  onExpired?: () => void;
}

/**
 * Formats remaining milliseconds into a human-readable string.
 *
 * @param ms - Remaining milliseconds
 * @returns Formatted string (e.g. "23h 14m", "5m 30s", "Expired")
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Countdown timer showing time until session expiry.
 * Pulses red when under 5 minutes remaining.
 */
export const TimerCountdown = memo(function TimerCountdown({
  expiresAt,
  onExpired,
}: TimerCountdownProps) {
  const [remaining, setRemaining] = useState(() => {
    return new Date(expiresAt).getTime() - Date.now();
  });

  const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000;
  const isExpired = remaining <= 0;

  const handleExpiry = useCallback(() => {
    onExpired?.();
  }, [onExpired]);

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(ms);

      if (ms <= 0) {
        clearInterval(interval);
        handleExpiry();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, handleExpiry]);

  return (
    <motion.div
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono ${
        isExpired
          ? 'bg-red-500/20 text-red-400'
          : isUrgent
            ? 'bg-red-500/10 text-red-400'
            : 'bg-white/5 text-white/60'
      }`}
      animate={
        isUrgent
          ? { opacity: [1, 0.5, 1] }
          : undefined
      }
      transition={
        isUrgent
          ? { repeat: Infinity, duration: 1 }
          : undefined
      }
    >
      <span>⏱</span>
      <span>{formatTimeRemaining(remaining)}</span>
    </motion.div>
  );
});
