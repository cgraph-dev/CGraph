/**
 * NotificationProvider barrel export
 * @module providers/notification-provider
 */

export { NotificationProvider, NotificationContext, default } from './NotificationProvider';
export { ToastItem } from './ToastItem';

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
