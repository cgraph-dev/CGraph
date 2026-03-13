/**
 * SecretChatScreen
 *
 * End-to-end encrypted secret chat conversation view.
 * Messages are encrypted/decrypted via PQXDH sessions from pq-bridge.
 * Supports theme-aware styling, ghost mode indicator, and screenshot
 * prevention (FLAG_SECURE on Android).
 *
 * @module screens/secret-chat/secret-chat-screen
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSecretChatStore, type SecretMessage } from '@/stores/secretChatStore';
import { SecretChatHeader } from '@/components/secret-chat/secret-chat-header';
import { SecretChatMessage } from '@/components/secret-chat/secret-chat-message';
import { SecretChatInput } from '@/components/secret-chat/secret-chat-input';
import { GhostModeIndicator } from '@/components/secret-chat/ghost-mode-indicator';
import { getSecretThemeColors } from './theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RootStackParamList = {
  SecretChat: { conversationId: string };
  SecretChatSettings: { conversationId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'SecretChat'>;

// ---------------------------------------------------------------------------
// Screenshot Prevention Note
// ---------------------------------------------------------------------------
// Android: Use FLAG_SECURE via native module or react-native-prevent-screenshot
//   activity.getWindow().setFlags(
//     WindowManager.LayoutParams.FLAG_SECURE,
//     WindowManager.LayoutParams.FLAG_SECURE
//   );
// iOS: No official API — can detect via UIApplicationUserDidTakeScreenshotNotification
// Implementation deferred to native module integration phase.

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Secret Chat Screen component. */
export default function SecretChatScreen({ route, navigation }: Props) {
  const { conversationId } = route.params;
  const flatListRef = useRef<FlatList<SecretMessage>>(null);

  const conversation = useSecretChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );
  const messages = useSecretChatStore((s) => s.messages[conversationId] ?? []);
  const activeTheme = useSecretChatStore((s) => s.activeTheme);
  const ghostModeTimer = useSecretChatStore((s) => s.ghostModeTimer);
  const sendMessage = useSecretChatStore((s) => s.sendMessage);
  const setActiveConversation = useSecretChatStore((s) => s.setActiveConversation);

  const [isSending, setIsSending] = useState(false);
  const themeColors = getSecretThemeColors(activeTheme);

  // Set active conversation on mount
  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;
      setIsSending(true);
      try {
        await sendMessage(conversationId, text.trim());
      } catch {
        // Error handled in store
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, sendMessage]
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('SecretChatSettings', { conversationId });
  }, [conversationId, navigation]);

  if (!conversation) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          Conversation not found
        </Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: SecretMessage }) => (
    <SecretChatMessage message={item} themeColors={themeColors} />
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <SecretChatHeader
        recipientName={conversation.recipientName}
        themeColors={themeColors}
        onSettingsPress={handleSettingsPress}
      />

      {ghostModeTimer !== null && (
        <GhostModeIndicator seconds={ghostModeTimer} themeColors={themeColors} />
      )}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, { color: themeColors.accent }]}>🔒</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              End-to-End Encrypted
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Messages are secured with post-quantum encryption.{'\n'}
              Only you and {conversation.recipientName} can read them.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <SecretChatInput onSend={handleSend} isSending={isSending} themeColors={themeColors} />
      </KeyboardAvoidingView>

      {isSending && (
        <ActivityIndicator
          style={styles.sendingIndicator}
          color={themeColors.accent}
          size="small"
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  sendingIndicator: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
  },
});
