import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../types';
import FriendListScreen from '../screens/friends/FriendListScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import UserProfileScreen from '../screens/friends/UserProfileScreen';

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
    </Stack.Navigator>
  );
}
