/**
 * GroupJoinCelebration — full-screen confetti overlay + welcome text
 * shown when a user joins a new group / server.
 *
 * Usage:
 * ```tsx
 * <GroupJoinCelebration
 *   groupName="Awesome Devs"
 *   show={justJoined}
 *   onComplete={() => setJustJoined(false)}
 * />
 * ```
 *
 * @module groups/components
 */

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';
import { tweens } from '@/lib/animation-presets';

export interface GroupJoinCelebrationProps {
  /** Name of the group the user just joined */
  groupName: string;
  /** Whether to show the celebration overlay */
  show: boolean;
  /** Called when the celebration finishes (after ~2.5s) */
  onComplete?: () => void;
}

export function GroupJoinCelebration({
  groupName,
  show,
  onComplete,
}: GroupJoinCelebrationProps) {
  const fireCelebration = useCallback(() => {
    // Big center burst
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'],
    });
    // Side bursts after 200ms
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (!show) return;
    fireCelebration();
    const timer = setTimeout(() => onComplete?.(), 2500);
    return () => clearTimeout(timer);
  }, [show, fireCelebration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tweens.standard}
        >
          {/* Backdrop dim */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Welcome text */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={springs.bouncy}
          >
            <motion.div
              className="text-4xl"
              initial={{ rotateZ: -10 }}
              animate={{ rotateZ: [0, 5, -5, 0] }}
              transition={{ ...tweens.smooth, delay: 0.2 }}
            >
              🎉
            </motion.div>
            <h2 className="mt-2 text-2xl font-bold text-white drop-shadow-lg">
              Welcome to
            </h2>
            <p className="mt-1 text-lg font-semibold text-primary-400 drop-shadow-lg">
              {groupName}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GroupJoinCelebration;
