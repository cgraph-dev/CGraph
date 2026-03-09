/**
 * Friends stack navigator with friend list, add friend, friend requests, and user profile screens.
 * @module navigation/FriendsNavigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../types';
import FriendListScreen from '../screens/friends/friend-list-screen';
import AddFriendScreen from '../screens/friends/add-friend-screen';
import FriendRequestsScreen from '../screens/friends/friend-requests-screen';
import UserProfileScreen from '../screens/friends/user-profile-screen';
// TODO(phase-26): Rewire — LeaderboardScreen deleted (../screens/community/leaderboard-screen)
import ContactsScreen from '../screens/social/contacts-screen';
import UserSearchScreen from '../screens/social/user-search-screen';
import ProfileEditScreen from '../screens/social/profile-edit-screen';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

/** Friends navigation stack. */
export default function FriendsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="FriendList" component={FriendListScreen} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      {/* TODO(phase-26): Rewire — Leaderboard screen removed */}
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="UserSearch" component={UserSearchScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}
