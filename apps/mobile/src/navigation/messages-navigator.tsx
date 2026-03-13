/**
 * Stack navigator for the messages section.
 * @module navigation/messages-navigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../types';
import { useThemeStore } from '@/stores';
import ConversationListScreen from '../screens/messages/conversation-list-screen';
import ConversationScreen from '../screens/messages/conversation-screen';
import NewConversationScreen from '../screens/messages/new-conversation-screen';
import SavedMessagesScreen from '../screens/messages/saved-messages-screen';
import SafetyNumberScreen from '../screens/chat/safety-number-screen';
import SecretChatScreen from '../screens/secret-chat/secret-chat-screen';
import SecretChatSettingsScreen from '../screens/secret-chat/secret-chat-settings-screen';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

/**
 * Messages stack navigator — conversation list, chat, and secret chat screens.
 */
export default function MessagesNavigator() {
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
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ title: '' }} />
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
      <Stack.Screen
        name="SafetyNumber"
        component={SafetyNumberScreen}
        options={{ title: 'Verify Identity' }}
      />
      {/* Phase 34 Screens */}
      <Stack.Screen
        name="SecretChat"
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
        component={SecretChatScreen as any}
        options={{ title: 'Secret Chat', headerShown: false }}
      />
      <Stack.Screen
        name="SecretChatSettings"
        component={SecretChatSettingsScreen}
        options={{ title: 'Secret Chat Settings', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
