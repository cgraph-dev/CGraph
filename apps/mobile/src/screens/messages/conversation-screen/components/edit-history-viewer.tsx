/**
 * EditHistoryViewer Component
 *
 * Bottom sheet modal listing previous message versions
 * in reverse chronological order with timestamps.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { EditHistory } from '../../../../types';

interface EditHistoryViewerProps {
  edits: EditHistory[];
  currentContent: string;
  visible: boolean;
  onClose: () => void;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    border: string;
  };
}

function formatEditTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Bottom sheet modal displaying the full edit history of a message.
 */
export function EditHistoryViewer({
  edits,
  currentContent,
  visible,
  onClose,
  colors,
}: EditHistoryViewerProps) {
  const sortedEdits = [...edits].sort((a, b) => b.editNumber - a.editNumber);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={historyStyles.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 30 : 80}
            tint="dark"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          />
        </Pressable>

        {/* Bottom sheet */}
        <View style={[historyStyles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle bar */}
          <View style={historyStyles.handleBar}>
            <View style={[historyStyles.handle, { backgroundColor: colors.textTertiary + '40' }]} />
          </View>

          {/* Header */}
          <View style={[historyStyles.header, { borderBottomColor: colors.border + '30' }]}>
            <Text style={[historyStyles.headerTitle, { color: colors.text }]}>Edit History</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={historyStyles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Current version */}
            <View style={[historyStyles.entry, { borderBottomColor: colors.border + '20' }]}>
              <View style={historyStyles.entryHeader}>
                <View style={[historyStyles.badge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[historyStyles.badgeText, { color: colors.primary }]}>Current</Text>
                </View>
                <Text style={[historyStyles.timestamp, { color: colors.textTertiary }]}>
                  Latest
                </Text>
              </View>
              <Text style={[historyStyles.content, { color: colors.text }]} numberOfLines={5}>
                {currentContent}
              </Text>
            </View>

            {/* Previous versions */}
            {sortedEdits.map((edit) => (
              <View
                key={edit.id}
                style={[historyStyles.entry, { borderBottomColor: colors.border + '20' }]}
              >
                <View style={historyStyles.entryHeader}>
                  <View
                    style={[historyStyles.badge, { backgroundColor: colors.textTertiary + '15' }]}
                  >
                    <Text style={[historyStyles.badgeText, { color: colors.textSecondary }]}>
                      Edit #{edit.editNumber}
                    </Text>
                  </View>
                  <Text style={[historyStyles.timestamp, { color: colors.textTertiary }]}>
                    {formatEditTime(edit.createdAt)}
                  </Text>
                </View>
                <Text
                  style={[historyStyles.content, { color: colors.textSecondary }]}
                  numberOfLines={5}
                >
                  {edit.previousContent}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const historyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  entry: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
});
