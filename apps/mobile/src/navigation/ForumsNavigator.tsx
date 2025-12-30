import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForumsStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ForumListScreen from '../screens/forums/ForumListScreen';
import ForumScreen from '../screens/forums/ForumScreen';
import PostScreen from '../screens/forums/PostScreen';
import CreatePostScreen from '../screens/forums/CreatePostScreen';
import CreateForumScreen from '../screens/forums/CreateForumScreen';

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
    </Stack.Navigator>
  );
}
