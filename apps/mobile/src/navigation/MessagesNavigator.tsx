import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import ConversationListScreen from '../screens/messages/ConversationListScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';
import NewConversationScreen from '../screens/messages/NewConversationScreen';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesNavigator() {
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
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ title: 'New Message', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
