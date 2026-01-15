/**
 * Push Notification Service for React Native Mobile App
 * 
 * Handles:
 * - Expo push notification registration
 * - Backend token synchronization
 * - Notification permission requests
 * - Token refresh and cleanup
 * 
 * @version 0.9.0
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../lib/api';

// Prevent repeated warning spam during development
let hasLoggedProjectIdWarning = false;
let hasLoggedDeviceWarning = false;

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface NotificationData {
  type?: string;
  id?: string;
  title?: string;
  body?: string;
  [key: string]: unknown;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    if (!hasLoggedDeviceWarning) {
      console.warn('[Push] Must use physical device for push notifications');
      hasLoggedDeviceWarning = true;
    }
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted for push notifications');
    return false;
  }

  // Set up notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  return true;
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    if (!hasLoggedDeviceWarning) {
      console.warn('[Push] Must use physical device for push notifications');
      hasLoggedDeviceWarning = true;
    }
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                      Constants.easConfig?.projectId;
    
    // Validate projectId is a proper UUID (not placeholder)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      if (!hasLoggedProjectIdWarning) {
        console.warn('[Push] No valid EAS project ID found. Push notifications disabled in development.');
        console.warn('[Push] To enable push notifications, run: npx expo login && eas project:init');
        hasLoggedProjectIdWarning = true;
      }
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    console.log('[Push] Got Expo push token:', token.substring(0, 30) + '...');
    return token;
  } catch (error) {
    console.error('[Push] Failed to get push token:', error);
    return null;
  }
}

/**
 * Register push token with the backend
 */
export async function registerPushTokenWithBackend(token: string): Promise<PushTokenResult> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 
                     Platform.OS === 'android' ? 'android' : 'expo';
    
    const deviceId = Constants.installationId || `${Platform.OS}-${Date.now()}`;
    const deviceName = Device.modelName || `${Platform.OS} Device`;

    const response = await api.post('/api/v1/push-tokens', {
      token,
      platform,
      device_id: deviceId,
      device_name: deviceName,
    });

    if (response.status === 201 || response.status === 200) {
      console.log('[Push] Token registered with backend successfully');
      return { success: true, token };
    }

    return { 
      success: false, 
      error: `Unexpected response status: ${response.status}` 
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Push] Failed to register token with backend:', message);
    return { success: false, error: message };
  }
}

/**
 * Unregister push token from the backend
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    await api.delete(`/api/v1/push-tokens/${encodeURIComponent(token)}`);
    console.log('[Push] Token unregistered from backend');
    return true;
  } catch (error) {
    console.error('[Push] Failed to unregister token:', error);
    return false;
  }
}

/**
 * Full push notification registration flow
 * 1. Request permissions
 * 2. Get Expo push token
 * 3. Register with backend
 */
export async function registerForPushNotifications(): Promise<PushTokenResult> {
  // Step 1: Request permissions
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return { success: false, error: 'Permission not granted' };
  }

  // Step 2: Get Expo push token
  const token = await getExpoPushToken();
  if (!token) {
    return { success: false, error: 'Failed to get push token' };
  }

  // Step 3: Register with backend
  return registerPushTokenWithBackend(token);
}

/**
 * Add listener for received notifications (while app is foregrounded)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification responses (user tapped notification)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (if app was opened from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  return Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Parse notification data from a notification response
 */
export function parseNotificationData(
  response: Notifications.NotificationResponse
): NotificationData {
  const { notification } = response;
  const { request } = notification;
  const { content } = request;
  
  return {
    type: (content.data?.type as string) || undefined,
    id: (content.data?.id as string) || undefined,
    title: content.title || undefined,
    body: content.body || undefined,
    ...content.data,
  };
}

export default {
  registerForPushNotifications,
  requestNotificationPermissions,
  getExpoPushToken,
  registerPushTokenWithBackend,
  unregisterPushToken,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
  getBadgeCount,
  setBadgeCount,
  clearAllNotifications,
  parseNotificationData,
};
