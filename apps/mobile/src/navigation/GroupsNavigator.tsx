import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import GroupListScreen from '../screens/groups/GroupListScreen';
import GroupScreen from '../screens/groups/GroupScreen';
import ChannelScreen from '../screens/groups/ChannelScreen';
import GroupSettingsScreen from '../screens/groups/GroupSettingsScreen';
import GroupRolesScreen from '../screens/groups/GroupRolesScreen';
import GroupMembersScreen from '../screens/groups/GroupMembersScreen';
import GroupChannelsScreen from '../screens/groups/GroupChannelsScreen';
import GroupInvitesScreen from '../screens/groups/GroupInvitesScreen';
import GroupModerationScreen from '../screens/groups/GroupModerationScreen';

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
      <Stack.Screen
        name="GroupRoles"
        component={GroupRolesScreen}
        options={{ title: 'Roles' }}
      />
      <Stack.Screen
        name="GroupMembers"
        component={GroupMembersScreen}
        options={{ title: 'Members' }}
      />
      <Stack.Screen
        name="GroupChannels"
        component={GroupChannelsScreen}
        options={{ title: 'Channels' }}
      />
      <Stack.Screen
        name="GroupInvites"
        component={GroupInvitesScreen}
        options={{ title: 'Invites' }}
      />
      <Stack.Screen
        name="GroupModeration"
        component={GroupModerationScreen}
        options={{ title: 'Moderation' }}
      />
    </Stack.Navigator>
  );
}
