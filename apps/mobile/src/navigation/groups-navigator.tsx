import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useTheme } from '../contexts/theme-context';
import GroupListScreen from '../screens/groups/group-list-screen';
import GroupScreen from '../screens/groups/group-screen';
import ChannelScreen from '../screens/groups/channel-screen';
import GroupSettingsScreen from '../screens/groups/group-settings-screen';
import GroupRolesScreen from '../screens/groups/group-roles-screen';
import GroupMembersScreen from '../screens/groups/group-members-screen';
import GroupChannelsScreen from '../screens/groups/group-channels-screen';
import GroupInvitesScreen from '../screens/groups/group-invites-screen';
import GroupModerationScreen from '../screens/groups/group-moderation-screen';

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
