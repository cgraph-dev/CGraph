/**
 * usePushNotifications Hook
 *
 * Provides push notification functionality to React components:
 * - Auto-registration when user is authenticated
 * - Notification listeners for foreground and tap events
 * - Navigation handling for notification taps
 *
 * @version 0.9.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import pushService, {
  registerForPushNotifications,
  shouldAttemptPushRegistration,
  parseNotificationData,
  type NotificationData,
} from '../services/pushNotifications';

export interface UsePushNotificationsResult {
  isRegistered: boolean;
  isRegistering: boolean;
  error: string | null;
  register: () => Promise<void>;
}

// Module-level flag to track if we've already attempted registration in this session
let hasAttemptedInSession = false;

export function usePushNotifications(): UsePushNotificationsResult {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const navigation = useNavigation();

  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Handle navigation when notification is tapped
  const handleNotificationNavigation = useCallback(
    (data: NotificationData) => {
      const { type, id } = data;

      if (!type || !id) return;

      const nav = navigation as any;

      switch (type) {
        case 'message':
        case 'direct_message':
          nav.navigate('Messages', {
            screen: 'Conversation',
            params: { conversationId: id },
          });
          break;
        case 'friend_request':
          nav.navigate('Friends', {
            screen: 'FriendRequests',
          });
          break;
        case 'group_invite':
          nav.navigate('Groups', {
            screen: 'Group',
            params: { groupId: id },
          });
          break;
        case 'forum_reply':
          nav.navigate('Forums', {
            screen: 'Post',
            params: { postId: id },
          });
          break;
        case 'mention':
          // Navigate based on mention context
          if (data.forum_id) {
            nav.navigate('Forums', {
              screen: 'Post',
              params: { postId: id },
            });
          } else if (data.group_id) {
            nav.navigate('Groups', {
              screen: 'Channel',
              params: { groupId: data.group_id, channelId: data.channel_id },
            });
          }
          break;
        default:
          // Default to notifications screen
          nav.navigate('Notifications');
      }
    },
    [navigation]
  );

  // Register for push notifications
  const register = useCallback(async () => {
    // Skip if already registering, registered, or previously attempted in this session
    if (isRegistering || isRegistered || hasAttemptedInSession) return;

    // Check if we should even try (prevents spam after failed attempt)
    if (!shouldAttemptPushRegistration()) {
      return;
    }

    hasAttemptedInSession = true;
    setIsRegistering(true);
    setError(null);

    try {
      const result = await registerForPushNotifications();

      if (result.success) {
        setIsRegistered(true);
        console.log('[Push Hook] Registration successful');
      } else {
        setError(result.error || 'Registration failed');
        // Only log once per session, not on every re-render
        if (!hasAttemptedInSession) {
          console.warn('[Push Hook] Registration failed:', result.error);
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      console.error('[Push Hook] Registration error:', e);
    } finally {
      setIsRegistering(false);
    }
  }, [isRegistering, isRegistered]);

  // Auto-register when authenticated and push notifications enabled
  useEffect(() => {
    if (isAuthenticated && settings.notifications.pushNotifications && !isRegistered) {
      register();
    }
  }, [isAuthenticated, settings.notifications.pushNotifications, isRegistered, register]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = pushService.addNotificationReceivedListener((notification) => {
      console.log('[Push Hook] Notification received:', notification.request.content.title);
      // Could trigger a toast or badge update here
    });

    // Listener for user tapping on a notification
    responseListener.current = pushService.addNotificationResponseReceivedListener((response) => {
      console.log('[Push Hook] Notification tapped');
      const data = parseNotificationData(response);
      handleNotificationNavigation(data);
    });

    // Check if app was opened from a notification
    pushService.getLastNotificationResponse().then((response) => {
      if (response) {
        console.log('[Push Hook] App opened from notification');
        const data = parseNotificationData(response);
        handleNotificationNavigation(data);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [handleNotificationNavigation]);

  return {
    isRegistered,
    isRegistering,
    error,
    register,
  };
}

export default usePushNotifications;
