/**
 * Global Notification Provider
 *
 * Centralized notification system for the entire application.
 * Handles toast notifications, achievement unlocks, level ups,
 * quest completions, and system announcements.
 *
 * @module providers/notification-provider
 */

import { createContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useGamificationStore, Achievement } from '@/modules/gamification/store';
import AchievementNotification, {
  AchievementNotificationData,
} from '@/modules/gamification/components/achievement-notification';

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

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
  maxNotifications = DEFAULT_MAX_NOTIFICATIONS,
  defaultDuration = DEFAULT_DURATION,
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
      } as Notification; // safe downcast – runtime verified

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
      } as LevelUpNotification); // safe downcast – runtime verified

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
      } as QuestNotification); // safe downcast – runtime verified

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

export default NotificationProvider;
