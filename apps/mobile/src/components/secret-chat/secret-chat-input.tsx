/**
 * SecretChatInput
 *
 * Text input that encrypts messages on send. Integrates with the
 * secret chat store's sendMessage action for PQXDH-encrypted delivery.
 *
 * @module components/secret-chat/secret-chat-input
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SecretChatInputProps {
  readonly onSend: (text: string) => Promise<void>;
  readonly isSending: boolean;
  readonly themeColors: SecretThemeColors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SecretChatInput({ onSend, isSending, themeColors }: SecretChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText('');
    await onSend(trimmed);
  }, [text, isSending, onSend]);

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
      <View style={[styles.inputWrapper, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.border }]}>
        <Ionicons
          name="lock-closed"
          size={14}
          color={themeColors.accent}
          style={styles.lockIcon}
        />
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Encrypted message..."
          placeholderTextColor={themeColors.textSecondary}
          multiline
          maxLength={4096}
          editable={!isSending}
          returnKeyType="default"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: canSend ? themeColors.accent : themeColors.border },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="send" size={18} color="#ffffff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minHeight: 40,
  },
  lockIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
