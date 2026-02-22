import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from '../types';
import { useTheme } from '../contexts/theme-context';
import NotificationsInboxScreen from '../screens/notifications/notifications-inbox-screen';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsNavigator() {
  const { colors } = useTheme();
  
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
