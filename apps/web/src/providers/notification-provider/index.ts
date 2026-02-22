/**
 * NotificationProvider barrel export
 * @module providers/notification-provider
 */

export { NotificationProvider, NotificationContext, default } from './notification-provider';
export { ToastItem } from './toast-item';

export type {
  NotificationType,
  BaseNotification,
  ToastNotification,
  LevelUpNotification,
  QuestNotification,
  Notification,
  NotificationContextType,
  NotificationProviderProps,
  ToastItemProps,
} from './types';
