import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../types';
import { useTheme } from '../contexts/theme-context';
import ConversationListScreen from '../screens/messages/conversation-list-screen';
import ConversationScreen from '../screens/messages/conversation-screen';
import NewConversationScreen from '../screens/messages/new-conversation-screen';
import SavedMessagesScreen from '../screens/messages/saved-messages-screen';

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
      <Stack.Screen
        name="SavedMessages"
        component={SavedMessagesScreen}
        options={{ title: 'Saved Messages' }}
      />
    </Stack.Navigator>
  );
}
