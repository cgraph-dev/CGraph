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

import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Achievement } from '@cgraph/shared-types';

/** @description Data for an achievement unlock notification. */
interface AchievementNotificationData {
  achievement: Achievement;
  isUnlock: boolean;
}

import { DEFAULT_DURATION, DEFAULT_MAX_NOTIFICATIONS } from './constants';
import { ToastItem } from './toast-item';
import type {
  Notification,
  ToastNotification,
  NotificationContextType,
  NotificationProviderProps,
} from './types';

/** Distributive Omit preserves union discrimination for notification variants */
type NotificationInput = Omit<ToastNotification, 'id'>;

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

  // Achievement notification
  const showAchievement = useCallback((achievement: Achievement, isUnlock = true) => {
    setAchievementNotifications((prev) =>
      [
        ...prev,
        {
          achievement: { ...achievement, unlocked: isUnlock },
          isUnlock,
        },
      ].slice(-5)
    );
  }, []);

  // Handle achievement dismissal
  const _handleDismissAchievement = useCallback((index: number) => {
    setAchievementNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);
  void _handleDismissAchievement;

  const contextValue: NotificationContextType = {
    toast,
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

      {/* Achievement Notifications — placeholder for AchievementNotification component */}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
