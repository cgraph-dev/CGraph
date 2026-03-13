/**
 * PanicWipeButton
 *
 * Long-press destructive action that wipes all secret chat data.
 * Requires a 2-second hold to confirm, with a visual progress indicator.
 *
 * @module modules/secret-chat/components/PanicWipeButton
 */

import { memo, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

/** Props for the PanicWipeButton component */
export interface PanicWipeButtonProps {
  /** Callback fired when the long-press wipe is confirmed */
  onWipe: () => void;
  /** Whether a wipe is currently in progress */
  isWiping?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/** Duration in ms the user must hold to confirm wipe */
const HOLD_DURATION = 2000;

/**
 * Long-press panic wipe button with visual confirmation.
 * User must hold for 2 seconds to trigger destruction of all session data.
 */
export const PanicWipeButton = memo(function PanicWipeButton({
  onWipe,
  isWiping = false,
  disabled = false,
}: PanicWipeButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = useCallback(() => {
    if (disabled || isWiping) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsHolding(false);
        setHoldProgress(0);
        onWipe();
      }
    }, 50);
  }, [disabled, isWiping, onWipe]);

  const cancelHold = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  return (
    <motion.button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        isWiping
          ? 'cursor-not-allowed bg-red-500/20 text-red-300'
          : disabled
            ? 'cursor-not-allowed bg-white/5 text-white/20'
            : 'bg-white/5 text-red-400 hover:bg-red-500/20 active:bg-red-500/30'
      }`}
      whileTap={!disabled && !isWiping ? { scale: 0.95 } : undefined}
      disabled={disabled || isWiping}
      title="Hold to panic wipe"
      aria-label="Panic wipe — hold to confirm"
    >
      {/* Progress ring */}
      {isHolding && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="rgb(239 68 68)"
            strokeWidth="2"
            strokeDasharray={`${holdProgress * 88} 88`}
            className="transition-none"
          />
        </svg>
      )}

      <span className="text-sm" role="img" aria-label="bomb">
        {isWiping ? '...' : '💣'}
      </span>
    </motion.button>
  );
});
