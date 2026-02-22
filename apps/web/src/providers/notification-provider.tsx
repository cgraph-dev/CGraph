/**
 * NotificationProvider - re-exports from modular components
 * @module providers
 */

export {
  NotificationProvider,
  NotificationContext,
  default,
  ToastItem,
} from './notification-provider/index';

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
} from './notification-provider/index';
