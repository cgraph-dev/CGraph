import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import GroupListScreen from '../screens/groups/GroupListScreen';
import GroupScreen from '../screens/groups/GroupScreen';
import ChannelScreen from '../screens/groups/ChannelScreen';
import GroupSettingsScreen from '../screens/groups/GroupSettingsScreen';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export default function GroupsNavigator() {
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
      }}
    >
      <Stack.Screen
        name="GroupList"
        component={GroupListScreen}
        options={{ title: 'Groups' }}
      />
      <Stack.Screen
        name="Group"
        component={GroupScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="Channel"
        component={ChannelScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="GroupSettings"
        component={GroupSettingsScreen}
        options={{ title: 'Group Settings', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
