/**
 * Global Notification Provider
 *
 * Centralized notification system for the entire application.
 * Handles toast notifications, achievement unlocks, level ups,
 * quest completions, and system announcements.
 *
 * @module providers/notification-provider
 */

import { createContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

import { HapticFeedback } from '@/lib/animations/animation-engine';
// TODO(phase-26): Rewire — gamification stores deleted
type Achievement = Record<string, unknown>;
// TODO(phase-26): Rewire — gamification components deleted (AchievementNotification)
interface AchievementNotificationData {
  achievement: Record<string, unknown>;
  isUnlock: boolean;
}

import { DEFAULT_DURATION, DEFAULT_MAX_NOTIFICATIONS } from './constants';
import { ToastItem } from './toast-item';
import type {
  Notification,
  ToastNotification,
  LevelUpNotification,
  QuestNotification,
  NotificationContextType,
  NotificationProviderProps,
} from './types';

/** Distributive Omit preserves union discrimination for notification variants */
type NotificationInput =
  | Omit<ToastNotification, 'id'>
  | Omit<LevelUpNotification, 'id'>
  | Omit<QuestNotification, 'id'>;

export const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * unknown.
 */
/**
 * Notification Provider — context provider wrapper.
 */
export function NotificationProvider({
  children,
  maxNotifications = DEFAULT_MAX_NOTIFICATIONS,
  defaultDuration = DEFAULT_DURATION,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [_achievementNotifications, setAchievementNotifications] = useState<
    AchievementNotificationData[]
  >([]);
  // Generate unique ID
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Add notification to queue
  const addNotification = useCallback(
    (notification: NotificationInput) => {
      const id = generateId();
      const defaults = {
        id,
        duration: notification.duration ?? defaultDuration,
        dismissible: notification.dismissible ?? true,
      };

      let newNotification: Notification;
      switch (notification.type) {
        case 'levelup':
          newNotification = { ...notification, ...defaults };
          break;
        case 'quest':
          newNotification = { ...notification, ...defaults };
          break;
        default:
          newNotification = { ...notification, ...defaults };
          break;
      }

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
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
      });

      // Celebration confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#8b5cf6'],
      });

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
      });

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
  const _handleDismissAchievement = useCallback((index: number) => {
    setAchievementNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

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

      {/* TODO(phase-26): Rewire — gamification components deleted (AchievementNotification) */}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
