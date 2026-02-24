/**
 * Toast item component for notifications
 * @module providers/notification-provider
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';

import { GlassCard } from '@/shared/components/ui';

import { NOTIFICATION_ICONS, NOTIFICATION_COLORS, DEFAULT_NOTIFICATION_COLOR } from './constants';
import type { ToastItemProps, LevelUpNotification, QuestNotification } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

export function ToastItem({ notification, index: _index, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const colors = NOTIFICATION_COLORS[notification.type] ?? DEFAULT_NOTIFICATION_COLOR;
  const icon = NOTIFICATION_ICONS[notification.type];

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

  // Special rendering for level up
  if (notification.type === 'levelup') {
    const levelNotif = notification as LevelUpNotification; // safe downcast – guarded by type check
    return (
      <motion.div
        initial={{ opacity: 0, x: -100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={springs.dramatic}
        className="pointer-events-auto"
      >
        <GlassCard
          variant="holographic"
          glow
          glowColor={colors.glow}
          className="relative overflow-hidden p-4"
        >
          <div className="absolute left-0 right-0 top-0 h-1 bg-dark-800">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <motion.div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={loop(tweens.slow)}
            >
              <span className="text-2xl font-bold text-white">{levelNotif.newLevel}</span>
            </motion.div>

            <div className="flex-1">
              <h4 className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-lg font-bold text-transparent">
                {notification.title}
              </h4>
              <p className="text-gray-300">{notification.message}</p>
              {levelNotif.rewards && levelNotif.rewards.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {levelNotif.rewards.map((reward, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400"
                    >
                      {reward}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {notification.dismissible && (
              <motion.button
                onClick={onDismiss}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
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

  // Quest complete rendering
  if (notification.type === 'quest') {
    const questNotif = notification as QuestNotification; // safe downcast – guarded by type check
    return (
      <motion.div
        initial={{ opacity: 0, x: -100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={springs.dramatic}
        className="pointer-events-auto"
      >
        <GlassCard
          variant="neon"
          glow
          glowColor={colors.glow}
          className="relative overflow-hidden p-4"
        >
          <div className="absolute left-0 right-0 top-0 h-1 bg-dark-800">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-emerald-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <motion.div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-emerald-500"
              animate={{ scale: [1, 1.1, 1] }}
              transition={loop(tweens.slow)}
            >
              <GiftIcon className="h-6 w-6 text-white" />
            </motion.div>

            <div className="flex-1">
              <h4 className="font-bold text-white">{notification.title}</h4>
              <p className="text-sm text-gray-400">{questNotif.questTitle}</p>
              <div className="mt-1 flex items-center gap-1 text-primary-400">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">+{questNotif.xpReward} XP</span>
              </div>
            </div>

            {notification.dismissible && (
              <motion.button
                onClick={onDismiss}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
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

  // Standard toast rendering
  return (
    <motion.div
      initial={{ opacity: 0, x: -100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={springs.dramatic}
      className="pointer-events-auto"
      role="alert"
      aria-live="polite"
    >
      <GlassCard
        variant="frosted"
        className={`relative overflow-hidden p-4 ${colors.bg} border ${colors.border}`}
      >
        {notification.duration && notification.duration > 0 && (
          <div className="absolute left-0 right-0 top-0 h-1 bg-dark-800">
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
              className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
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
