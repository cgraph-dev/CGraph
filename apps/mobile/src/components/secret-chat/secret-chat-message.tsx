/**
 * SecretChatMessage
 *
 * Renders a single message bubble in a secret chat.
 * Displays decrypted plaintext (or a placeholder if not yet decrypted).
 * Theme-aware styling with sent/received differentiation.
 *
 * @module components/secret-chat/secret-chat-message
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SecretMessage } from '@/stores/secretChatStore';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SecretChatMessageProps {
  readonly message: SecretMessage;
  readonly themeColors: SecretThemeColors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Description. */
/** Secret Chat Message component. */
export function SecretChatMessage({ message, themeColors }: SecretChatMessageProps) {
  const timeStr = useMemo(() => formatTime(message.timestamp), [message.timestamp]);
  const { isOwn } = message;

  return (
    <View style={[styles.container, isOwn ? styles.containerSent : styles.containerReceived]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isOwn ? themeColors.bubbleSent : themeColors.bubbleReceived,
          },
          isOwn ? styles.bubbleSent : styles.bubbleReceived,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isOwn ? themeColors.bubbleTextSent : themeColors.bubbleTextReceived },
          ]}
        >
          {message.plaintext ?? '🔐 Encrypted message'}
        </Text>
        <Text
          style={[
            styles.timestamp,
            {
              color: isOwn
                ? `${themeColors.bubbleTextSent}99`
                : `${themeColors.bubbleTextReceived}99`,
            },
          ]}
        >
          {timeStr}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  containerSent: {
    alignItems: 'flex-end',
  },
  containerReceived: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleSent: {
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
