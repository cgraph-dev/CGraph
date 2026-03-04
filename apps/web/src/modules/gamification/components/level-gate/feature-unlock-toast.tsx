/**
 * Feature Unlock Toast — Celebration notification on level-up
 *
 * Full-width banner that slides down when a user unlocks a new
 * feature by reaching the required level. Shows feature name,
 * description, progress bar, and "Explore Now" CTA.
 *
 * @module modules/gamification/components/level-gate/feature-unlock-toast
 */

import { durations } from '@cgraph/animation-constants';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FEATURE_DISPLAY_NAMES,
  type FeatureGateKey,
} from '@cgraph/shared-types';
import { springs } from '@/lib/animation-presets';

/** Description text for each unlockable feature */
const FEATURE_DESCRIPTIONS: Partial<Record<FeatureGateKey, string>> = {
  quests: 'Complete daily and weekly quests for bonus XP and coins!',
  daily_rewards: 'Claim daily login rewards to keep your streak alive!',
  leaderboard: 'See how you rank against other users globally!',
  shop: 'Browse and purchase cosmetics, titles, and more!',
  cosmetics: 'Customize your avatar with borders, themes, and effects!',
  titles: 'Equip titles to show off your achievements!',
  animated_borders: 'Unlock animated avatar borders for premium flair!',
  marketplace: 'Trade items with other users in the marketplace!',
  battle_pass: 'Access seasonal battle passes for exclusive rewards!',
  events: 'Participate in special seasonal events!',
  trading: 'Trade directly with other players!',
  prestige: 'Reset your progress for permanent bonuses and exclusive rewards!',
};

/** Map of features to explore paths */
const FEATURE_PATHS: Partial<Record<FeatureGateKey, string>> = {
  quests: '/quests',
  shop: '/shop',
  cosmetics: '/customize',
  titles: '/profile',
  marketplace: '/marketplace',
  events: '/events',
  prestige: '/prestige',
  leaderboard: '/leaderboard',
};

/** Whether a feature gets the premium confetti effect */
const PREMIUM_FEATURES = new Set<FeatureGateKey>([
  'marketplace',
  'prestige',
  'battle_pass',
  'animated_borders',
  'trading',
]);

interface FeatureUnlockToastProps {
  /** The feature that was unlocked */
  feature: FeatureGateKey;
  /** The level that was reached */
  level: number;
  /** Called when the toast is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss timeout in ms (default 8000) */
  autoDismissMs?: number;
}

/**
 * Celebration toast shown when a user levels up and unlocks a new feature.
 */
export function FeatureUnlockToast({
  feature,
  level,
  onDismiss,
  autoDismissMs = 8000,
}: FeatureUnlockToastProps) {
  const [visible, setVisible] = useState(true);
  const isPremium = PREMIUM_FEATURES.has(feature);
  const featureName = FEATURE_DISPLAY_NAMES[feature] ?? feature;
  const description = FEATURE_DESCRIPTIONS[feature] ?? `${featureName} is now available!`;
  const explorePath = FEATURE_PATHS[feature];

  const handleDismiss = useCallback(() => {
    setVisible(false);
    // Let the exit animation finish
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={springs.bouncy}
          className="pointer-events-auto fixed left-0 right-0 top-0 z-[100] mx-auto max-w-md"
          role="alert"
          aria-live="polite"
        >
          <div
            className={`m-4 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl ${
              isPremium
                ? 'border-amber-500/40 bg-gradient-to-r from-amber-900/90 via-purple-900/90 to-amber-900/90'
                : 'border-primary-500/30 bg-gradient-to-r from-dark-800/95 via-purple-900/40 to-dark-800/95'
            }`}
            style={{
              boxShadow: isPremium
                ? '0 0 40px rgba(245, 158, 11, 0.3)'
                : '0 0 30px rgba(139, 92, 246, 0.2)',
            }}
          >
            {/* Confetti particles for premium features */}
            {isPremium &&
              [...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${Math.random() * 100}%`,
                    background: ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444'][i % 4],
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, (Math.random() - 0.5) * 20, 0],
                    opacity: [0.8, 1, 0.4],
                    scale: [0.8, 1.2, 0.6],
                  }}
                  transition={{
                    duration: durations.ambient.ms / 1000 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 0.5,
                  }}
                />
              ))}

            <div className="relative flex items-center gap-4 p-4">
              {/* Unlock icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...springs.bouncy, delay: 0.2 }}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  isPremium
                    ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                    : 'bg-gradient-to-br from-purple-500 to-primary-500'
                }`}
              >
                <span className="text-2xl" role="img" aria-hidden="true">
                  🎉
                </span>
              </motion.div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <motion.p
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-bold text-white"
                >
                  Level {level} — {featureName} Unlocked!
                </motion.p>
                <motion.p
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-0.5 text-xs text-gray-300"
                >
                  {description}
                </motion.p>
                {explorePath && (
                  <motion.a
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    href={explorePath}
                    className={`mt-1.5 inline-block text-xs font-semibold ${
                      isPremium
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-primary-400 hover:text-primary-300'
                    }`}
                  >
                    Explore Now →
                  </motion.a>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Manager component that queues and shows unlock toasts sequentially.
 * Place this at the app root level.
 */
export function FeatureUnlockToastManager({
  unlockedFeatures,
  level,
  onAllDismissed,
}: {
  unlockedFeatures: FeatureGateKey[];
  level: number;
  onAllDismissed: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDismiss = useCallback(() => {
    if (currentIndex + 1 >= unlockedFeatures.length) {
      onAllDismissed();
    } else {
      // Show next toast after a short delay
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
    }
  }, [currentIndex, unlockedFeatures.length, onAllDismissed]);

  if (currentIndex >= unlockedFeatures.length) return null;

  const feature = unlockedFeatures[currentIndex];
  if (!feature) return null;

  return (
    <FeatureUnlockToast
      key={feature}
      feature={feature}
      level={level}
      onDismiss={handleDismiss}
    />
  );
}
