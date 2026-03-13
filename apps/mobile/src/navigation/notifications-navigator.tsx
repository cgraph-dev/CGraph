/**
 * Stack navigator for the notifications section.
 * @module navigation/notifications-navigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from '../types';
import { useThemeStore } from '@/stores';
import NotificationsInboxScreen from '../screens/notifications/notifications-inbox-screen';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

/**
 * Notifications Navigator component.
 *
 */
export default function NotificationsNavigator() {
  const { colors } = useThemeStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="NotificationsInbox"
        component={NotificationsInboxScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
