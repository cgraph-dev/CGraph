import { use } from 'react';
import {
  NotificationContext,
  type NotificationContextType,
} from '@/providers/notification-provider';

/**
 * Hook to access the notification system.
 * Must be used within NotificationProvider.
 *
 * @returns NotificationContextType with methods to show notifications
 * @throws Error if used outside NotificationProvider
 */
export function useNotification(): NotificationContextType {
  const context = use(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export default useNotification;
