/**
 * PanicWipeButton
 *
 * Red button with double-tap confirmation dialog that destroys
 * all secret chat data, sessions, and encryption keys.
 * Calls useSecretChatStore.panicWipe() on confirmation.
 *
 * @module components/secret-chat/panic-wipe-button
 */

import React, { useState, useCallback } from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecretChatStore } from '@/stores/secretChatStore';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PanicWipeButtonProps {
  readonly themeColors: SecretThemeColors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PanicWipeButton({ themeColors: _themeColors }: PanicWipeButtonProps) {
  const panicWipe = useSecretChatStore((s) => s.panicWipe);
  const [isWiping, setIsWiping] = useState(false);

  const handlePress = useCallback(() => {
    Alert.alert(
      '⚠️ Panic Wipe',
      'This will permanently destroy ALL secret chat data:\n\n' +
        '• All conversations and messages\n' +
        '• All encryption sessions and keys\n' +
        '• Server-side secret chat data\n\n' +
        'This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Destroy Everything',
          style: 'destructive',
          onPress: async () => {
            setIsWiping(true);
            try {
              await panicWipe();
              Alert.alert('Wiped', 'All secret chat data has been destroyed.');
            } catch {
              Alert.alert('Error', 'Failed to complete panic wipe. Some data may remain.');
            } finally {
              setIsWiping(false);
            }
          },
        },
      ]
    );
  }, [panicWipe]);

  return (
    <TouchableOpacity
      style={[styles.button, isWiping && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={isWiping}
      activeOpacity={0.7}
    >
      {isWiping ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Ionicons name="trash" size={18} color="#ffffff" />
      )}
      <Text style={styles.buttonText}>
        {isWiping ? 'Wiping...' : 'Panic Wipe — Destroy All Data'}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
