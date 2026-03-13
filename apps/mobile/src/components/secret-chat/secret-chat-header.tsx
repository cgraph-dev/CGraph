/**
 * SecretChatHeader
 *
 * Displays a lock icon, encryption indicator, and recipient name
 * for the secret chat conversation. Theme-aware styling.
 *
 * @module components/secret-chat/secret-chat-header
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SecretThemeColors } from '@/screens/secret-chat/theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SecretChatHeaderProps {
  readonly recipientName: string;
  readonly themeColors: SecretThemeColors;
  readonly onSettingsPress?: () => void;
  readonly onBackPress?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Description. */
/** Secret Chat Header component. */
export function SecretChatHeader({
  recipientName,
  themeColors,
  onSettingsPress,
  onBackPress,
}: SecretChatHeaderProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border },
      ]}
    >
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
      )}

      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={16} color={themeColors.accent} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.recipientName, { color: themeColors.text }]} numberOfLines={1}>
          {recipientName}
        </Text>
        <View style={styles.encryptionRow}>
          <Ionicons name="shield-checkmark" size={12} color={themeColors.accent} />
          <Text style={[styles.encryptionLabel, { color: themeColors.accent }]}>
            Post-Quantum Encrypted
          </Text>
        </View>
      </View>

      {onSettingsPress && (
        <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={22} color={themeColors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  lockContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  encryptionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 4,
    marginLeft: 8,
  },
});
