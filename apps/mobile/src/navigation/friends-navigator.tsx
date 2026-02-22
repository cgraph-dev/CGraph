import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../types';
import FriendListScreen from '../screens/friends/friend-list-screen';
import AddFriendScreen from '../screens/friends/add-friend-screen';
import FriendRequestsScreen from '../screens/friends/friend-requests-screen';
import UserProfileScreen from '../screens/friends/user-profile-screen';
import LeaderboardScreen from '../screens/community/leaderboard-screen';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

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
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}
