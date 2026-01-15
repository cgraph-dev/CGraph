import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForumsStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ForumListScreen from '../screens/forums/ForumListScreen';
import ForumScreen from '../screens/forums/ForumScreen';
import PostScreen from '../screens/forums/PostScreen';
import CreatePostScreen from '../screens/forums/CreatePostScreen';
import CreateForumScreen from '../screens/forums/CreateForumScreen';
// MyBB-style forum screens
import ForumBoardScreen from '../screens/forums/ForumBoardScreen';
import ForumSettingsScreen from '../screens/forums/ForumSettingsScreen';
import ForumAdminScreen from '../screens/forums/ForumAdminScreen';
import ForumLeaderboardScreen from '../screens/forums/ForumLeaderboardScreen';
import PluginMarketplaceScreen from '../screens/forums/PluginMarketplaceScreen';

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
