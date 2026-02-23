/**
 * Forums stack navigator with forum listing, thread viewing, and post creation screens.
 * @module navigation/ForumsNavigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForumsStackParamList } from '../types';
import { useTheme } from '../contexts/theme-context';
import ForumListScreen from '../screens/forums/forum-list-screen';
import ForumScreen from '../screens/forums/forum-screen';
import PostScreen from '../screens/forums/post-screen';
import CreatePostScreen from '../screens/forums/create-post-screen';
import CreateForumScreen from '../screens/forums/create-forum-screen';
// MyBB-style forum screens
import ForumBoardScreen from '../screens/forums/forum-board-screen';
import ForumSettingsScreen from '../screens/forums/forum-settings-screen';
import ForumAdminScreen from '../screens/forums/forum-admin-screen';
import ForumLeaderboardScreen from '../screens/forums/forum-leaderboard-screen';
import PluginMarketplaceScreen from '../screens/forums/plugin-marketplace-screen';

const Stack = createNativeStackNavigator<ForumsStackParamList>();

export default function ForumsNavigator() {
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
        name="ForumList"
        component={ForumListScreen}
        options={{ title: 'Forums' }}
      />
      <Stack.Screen
        name="Forum"
        component={ForumScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="Post"
        component={PostScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Create Post', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreateForum"
        component={CreateForumScreen}
        options={{ title: 'Create Forum', presentation: 'modal' }}
      />
      {/* MyBB-style forum screens */}
      <Stack.Screen
        name="ForumBoard"
        component={ForumBoardScreen}
        options={{ title: 'Board' }}
      />
      <Stack.Screen
        name="ForumSettings"
        component={ForumSettingsScreen}
        options={{ title: 'Forum Settings' }}
      />
      <Stack.Screen
        name="ForumAdmin"
        component={ForumAdminScreen}
        options={{ title: 'Admin Panel' }}
      />
      <Stack.Screen
        name="ForumLeaderboard"
        component={ForumLeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <Stack.Screen
        name="PluginMarketplace"
        component={PluginMarketplaceScreen}
        options={{ title: 'Plugins' }}
      />
    </Stack.Navigator>
  );
}
