/**
 * Groups stack navigator with group listing, channels, settings, and member management screens.
 * @module navigation/GroupsNavigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupsStackParamList } from '../types';
import { useThemeStore } from '@/stores';
import GroupListScreen from '../screens/groups/group-list-screen';
import CreateGroupScreen from '../screens/groups/create-group-screen';
import ExploreGroupsScreen from '../screens/groups/explore-groups-screen';
import GroupScreen from '../screens/groups/group-screen';
import ChannelScreen from '../screens/groups/channel-screen';
import GroupSettingsScreen from '../screens/groups/group-settings-screen';
import GroupRolesScreen from '../screens/groups/group-roles-screen';
import GroupMembersScreen from '../screens/groups/group-members-screen';
import GroupChannelsScreen from '../screens/groups/group-channels-screen';
import GroupInvitesScreen from '../screens/groups/group-invites-screen';
import GroupModerationScreen from '../screens/groups/group-moderation-screen';
import ChannelPermissionsScreen from '../screens/groups/channel-permissions-screen';
import ReportContentScreen from '../screens/groups/report-content-screen';
import BanListScreen from '../screens/groups/ban-list-screen';
import AutomodSettingsScreen from '../screens/groups/automod-settings-screen';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

/**
 *
 */
export default function GroupsNavigator() {
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
      }}
    >
      <Stack.Screen
        name="GroupList"
        component={GroupListScreen}
        options={{ title: 'Groups' }}
      />
      <Stack.Screen
        name="ExploreGroups"
        component={ExploreGroupsScreen}
        options={{ title: 'Explore Groups' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group', presentation: 'modal' }}
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
      <Stack.Screen
        name="ChannelPermissions"
        component={ChannelPermissionsScreen}
        options={{ title: 'Channel Permissions' }}
      />
      <Stack.Screen
        name="ReportContent"
        component={ReportContentScreen}
        options={{ title: 'Report', presentation: 'modal' }}
      />
      <Stack.Screen
        name="BanList"
        component={BanListScreen}
        options={{ title: 'Ban List' }}
      />
      <Stack.Screen
        name="AutomodSettings"
        component={AutomodSettingsScreen}
        options={{ title: 'Automod Settings' }}
      />
    </Stack.Navigator>
  );
}
