import { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  SparklesIcon,
  BoltIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore, Achievement } from '@/stores/gamificationStore';
import AchievementNotification, {
  AchievementNotificationData,
} from '@/modules/gamification/components/AchievementNotification';
import confetti from 'canvas-confetti';

/**
 * Global Notification Provider
 *
 * Centralized notification system for the entire application.
 * Handles:
 * - Toast notifications (success, error, warning, info)
 * - Achievement unlock notifications
 * - Level up celebrations
 * - Quest completions
 * - System announcements
 * - Real-time WebSocket notifications
 *
 * Designed for production with:
 * - Queue management
 * - Auto-dismiss with progress
 * - Haptic feedback
 * - Sound effects support
 * - Accessibility (ARIA)
 */

// Notification Types
type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'levelup'
  | 'quest';

interface BaseNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 for persistent
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotification extends BaseNotification {
  type: 'success' | 'error' | 'warning' | 'info';
}

interface LevelUpNotification extends BaseNotification {
  type: 'levelup';
  newLevel: number;
  rewards?: string[];
}

interface QuestNotification extends BaseNotification {
  type: 'quest';
  xpReward: number;
  questTitle: string;
}

type Notification = ToastNotification | LevelUpNotification | QuestNotification;

export interface NotificationContextType {
  // Toast notifications
  toast: {
    success: (title: string, message?: string, options?: Partial<ToastNotification>) => void;
    error: (title: string, message?: string, options?: Partial<ToastNotification>) => void;
    warning: (title: string, message?: string, options?: Partial<ToastNotification>) => void;
    info: (title: string, message?: string, options?: Partial<ToastNotification>) => void;
  };
  // Special notifications
  showLevelUp: (newLevel: number, rewards?: string[]) => void;
  showQuestComplete: (questTitle: string, xpReward: number) => void;
  showAchievement: (achievement: Achievement, isUnlock?: boolean) => void;
  // Management
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

// Notification Icons
const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
  error: <XCircleIcon className="h-6 w-6 text-red-400" />,
  warning: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />,
  info: <InformationCircleIcon className="h-6 w-6 text-blue-400" />,
  levelup: <BoltIcon className="h-6 w-6 text-yellow-400" />,
  quest: <GiftIcon className="h-6 w-6 text-primary-400" />,
};

const NOTIFICATION_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', glow: 'rgba(34, 197, 94, 0.3)' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'rgba(239, 68, 68, 0.3)' },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'rgba(234, 179, 8, 0.3)',
  },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'rgba(59, 130, 246, 0.3)' },
  levelup: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'rgba(234, 179, 8, 0.4)',
  },
  quest: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/30',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
};

const DEFAULT_NOTIFICATION_COLOR = {
  bg: 'bg-gray-500/10',
  border: 'border-gray-500/30',
  glow: 'rgba(107, 114, 128, 0.3)',
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<
    AchievementNotificationData[]
  >([]);
  const { recentlyUnlocked } = useGamificationStore();

  // Generate unique ID
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Add notification to queue
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = generateId();
      const newNotification = {
        ...notification,
        id,
        duration: notification.duration ?? defaultDuration,
        dismissible: notification.dismissible ?? true,
      } as Notification;

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        // Keep only the most recent notifications
        return updated.slice(-maxNotifications);
      });

      // Haptic feedback based on type
      switch (notification.type) {
        case 'success':
        case 'levelup':
        case 'quest':
          HapticFeedback.success();
          break;
        case 'error':
          HapticFeedback.error();
          break;
        case 'warning':
          HapticFeedback.heavy();
          break;
        default:
          HapticFeedback.light();
      }

      return id;
    },
    [defaultDuration, maxNotifications]
  );

  // Dismiss notification
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Dismiss all
  const dismissAll = useCallback(() => {
    setNotifications([]);
    setAchievementNotifications([]);
  }, []);

  // Toast helpers
  const toast = {
    success: (title: string, message?: string, options?: Partial<ToastNotification>) => {
      addNotification({ type: 'success', title, message, ...options });
    },
    error: (title: string, message?: string, options?: Partial<ToastNotification>) => {
      addNotification({ type: 'error', title, message, ...options });
    },
    warning: (title: string, message?: string, options?: Partial<ToastNotification>) => {
      addNotification({ type: 'warning', title, message, ...options });
    },
    info: (title: string, message?: string, options?: Partial<ToastNotification>) => {
      addNotification({ type: 'info', title, message, ...options });
    },
  };

  // Level up notification
  const showLevelUp = useCallback(
    (newLevel: number, rewards?: string[]) => {
      addNotification({
        type: 'levelup',
        title: `Level Up!`,
        message: `You've reached level ${newLevel}!`,
        newLevel,
        rewards,
        duration: 8000,
      } as LevelUpNotification);

      // Celebration confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#8b5cf6'],
      });

      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { x: 0.3, y: 0.6 },
        });
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { x: 0.7, y: 0.6 },
        });
      }, 300);
    },
    [addNotification]
  );

  // Quest complete notification
  const showQuestComplete = useCallback(
    (questTitle: string, xpReward: number) => {
      addNotification({
        type: 'quest',
        title: 'Quest Complete!',
        message: questTitle,
        questTitle,
        xpReward,
        duration: 6000,
      } as QuestNotification);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
    },
    [addNotification]
  );

  // Achievement notification
  const showAchievement = useCallback((achievement: Achievement, isUnlock = true) => {
    setAchievementNotifications((prev) =>
      [
        ...prev,
        {
          achievement: { ...achievement, progress: achievement.progress || 0, unlocked: isUnlock },
          isUnlock,
        },
      ].slice(-5)
    );
  }, []);

  // Handle achievement dismissal
  const handleDismissAchievement = useCallback((index: number) => {
    setAchievementNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Watch for achievement unlocks from gamification store
  useEffect(() => {
    if (recentlyUnlocked.length > 0) {
      const latestAchievement = recentlyUnlocked[recentlyUnlocked.length - 1];
      if (latestAchievement) {
        showAchievement(latestAchievement, true);
      }
    }
  }, [recentlyUnlocked, showAchievement]);

  const contextValue: NotificationContextType = {
    toast,
    showLevelUp,
    showQuestComplete,
    showAchievement,
    dismiss,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Toast Notifications Container */}
      <div className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-md space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <ToastItem
              key={notification.id}
              notification={notification}
              index={index}
              onDismiss={() => dismiss(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Achievement Notifications Container */}
      <AchievementNotification
        notifications={achievementNotifications}
        onDismiss={handleDismissAchievement}
      />
    </NotificationContext.Provider>
  );
}

// Toast Item Component
function ToastItem({
  notification,
  index,
  onDismiss,
}: {
  notification: Notification;
  index: number;
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const colors = NOTIFICATION_COLORS[notification.type] ?? DEFAULT_NOTIFICATION_COLOR;
  const icon = NOTIFICATION_ICONS[notification.type];

  // Auto-dismiss timer
  useEffect(() => {
    if (!notification.duration || notification.duration === 0) return;

    const startTime = Date.now();
    const duration = notification.duration;

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
    const levelNotif = notification as LevelUpNotification;
    return (
      <motion.div
        initial={{ opacity: 0, x: -100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.05 }}
        className="pointer-events-auto"
      >
        <GlassCard
          variant="holographic"
          glow
          glowColor={colors.glow}
          className="relative overflow-hidden p-4"
        >
          {/* Progress bar */}
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
              transition={{ duration: 1, repeat: Infinity }}
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
    const questNotif = notification as QuestNotification;
    return (
      <motion.div
        initial={{ opacity: 0, x: -100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.05 }}
        className="pointer-events-auto"
      >
        <GlassCard
          variant="neon"
          glow
          glowColor={colors.glow}
          className="relative overflow-hidden p-4"
        >
          {/* Progress bar */}
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
              transition={{ duration: 1, repeat: Infinity }}
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
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: index * 0.05 }}
      className="pointer-events-auto"
      role="alert"
      aria-live="polite"
    >
      <GlassCard
        variant="frosted"
        className={`relative overflow-hidden p-4 ${colors.bg} border ${colors.border}`}
      >
        {/* Progress bar */}
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

export default NotificationProvider;
