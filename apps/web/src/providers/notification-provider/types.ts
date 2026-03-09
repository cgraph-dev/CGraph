/**
 * Type definitions for NotificationProvider
 * @module providers/notification-provider
 */

// TODO(phase-26): Rewire — gamification stores deleted
type Achievement = Record<string, unknown>;

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'levelup'
  | 'quest';

export interface BaseNotification {
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

export interface ToastNotification extends BaseNotification {
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface LevelUpNotification extends BaseNotification {
  type: 'levelup';
  newLevel: number;
  rewards?: string[];
}

export interface QuestNotification extends BaseNotification {
  type: 'quest';
  xpReward: number;
  questTitle: string;
}

export type Notification = ToastNotification | LevelUpNotification | QuestNotification;

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

export interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export interface ToastItemProps {
  notification: Notification;
  index: number;
  onDismiss: () => void;
}
