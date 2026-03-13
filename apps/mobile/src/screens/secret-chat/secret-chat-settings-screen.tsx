/**
 * SecretChatSettingsScreen
 *
 * Settings for a secret chat conversation: ghost mode timer, theme picker,
 * and panic wipe button with confirmation dialog.
 *
 * @module screens/secret-chat/secret-chat-settings-screen
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSecretChatStore, type SecretThemeId } from '@/stores/secretChatStore';
import { PanicWipeButton } from '@/components/secret-chat/panic-wipe-button';
import { SECRET_THEMES, getSecretThemeColors } from './theme-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RootStackParamList = {
  SecretChat: { conversationId: string };
  SecretChatSettings: { conversationId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'SecretChatSettings'>;

// ---------------------------------------------------------------------------
// Ghost Mode Options
// ---------------------------------------------------------------------------

const GHOST_MODE_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '5s', value: 5 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '1h', value: 3600 },
  { label: '24h', value: 86400 },
  { label: 'Off', value: null },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Secret Chat Settings Screen component. */
export default function SecretChatSettingsScreen({ navigation }: Props) {
  const activeTheme = useSecretChatStore((s) => s.activeTheme);
  const ghostModeTimer = useSecretChatStore((s) => s.ghostModeTimer);
  const setTheme = useSecretChatStore((s) => s.setTheme);
  const enableGhostMode = useSecretChatStore((s) => s.enableGhostMode);

  const themeColors = getSecretThemeColors(activeTheme);

  const handleThemeSelect = useCallback(
    (themeId: SecretThemeId) => {
      void setTheme(themeId);
    },
    [setTheme]
  );

  const handleGhostModeSelect = useCallback(
    (seconds: number | null) => {
      enableGhostMode(seconds);
    },
    [enableGhostMode]
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Secret Chat Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ─── Ghost Mode ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="timer-outline" size={20} color={themeColors.accent} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Ghost Mode</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
            Messages will auto-delete after the selected time. When the timer expires, all messages
            in the active conversation are cleared.
          </Text>
          <View style={styles.optionRow}>
            {GHOST_MODE_OPTIONS.map((option) => {
              const isActive =
                option.value === null
                  ? ghostModeTimer === null
                  : ghostModeTimer !== null && option.value === ghostModeTimer;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionPill,
                    { borderColor: themeColors.border },
                    isActive && {
                      backgroundColor: themeColors.accent,
                      borderColor: themeColors.accent,
                    },
                  ]}
                  onPress={() => handleGhostModeSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: themeColors.textSecondary },
                      isActive && { color: '#ffffff', fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Theme Picker ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={themeColors.accent} />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Theme</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
            Choose a visual theme for your secret chats.
          </Text>
          <View style={styles.themeGrid}>
            {SECRET_THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    { borderColor: isActive ? themeColors.accent : themeColors.border },
                    isActive && styles.themeCardActive,
                  ]}
                  onPress={() => handleThemeSelect(theme.id)}
                >
                  <View style={[styles.themePreview, { backgroundColor: theme.previewColor }]} />
                  <Text
                    style={[
                      styles.themeName,
                      { color: themeColors.text },
                      isActive && { color: themeColors.accent, fontWeight: '600' },
                    ]}
                    numberOfLines={1}
                  >
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Panic Wipe ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={20} color="#dc2626" />
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Danger Zone</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
            Permanently destroy all secret chat data, sessions, and encryption keys. This action
            cannot be undone.
          </Text>
          <PanicWipeButton themeColors={themeColors} />
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  spacer: {
    width: 32,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: '30%',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 8,
  },
  themeCardActive: {
    borderWidth: 2,
  },
  themePreview: {
    width: '100%',
    height: 48,
    marginBottom: 6,
  },
  themeName: {
    fontSize: 12,
  },
});
