import { useContext } from 'react';
import {
  NotificationContext,
  type NotificationContextType,
} from '@/providers/NotificationProvider';

/**
 * Hook to access the notification system.
 * Must be used within NotificationProvider.
 *
 * @returns NotificationContextType with methods to show notifications
 * @throws Error if used outside NotificationProvider
 */
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export default useNotification;
