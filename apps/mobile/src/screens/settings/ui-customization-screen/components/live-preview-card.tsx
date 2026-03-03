/**
 * LivePreviewCard Component
 *
 * Shows a real-time preview of the current theme settings.
 *
 * @module screens/settings/UICustomizationScreen/components
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCustomizationStore } from '@/stores';

/**
 * Live preview of current theme customization.
 */
export function LivePreviewCard() {
  const { theme } = useCustomizationStore();
  const { colors, spacing, borderRadius, effects } = theme;

  return (
    <View style={styles.previewSection}>
      <Text style={styles.previewTitle}>Live Preview</Text>
      <BlurView
        intensity={effects.blur.intensity}
        tint="dark"
        style={[
          styles.previewCard,
          {
            borderRadius: borderRadius.lg,
            padding: spacing.scale.md,
          },
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={[styles.previewAvatar, { backgroundColor: colors.primary[500] }]}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={[styles.previewName, { color: colors.text.primary }]}>Sample User</Text>
            <Text style={[styles.previewSubtext, { color: colors.text.secondary }]}>
              This is how your theme looks
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.previewButton,
            {
              backgroundColor: colors.primary[500],
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={styles.previewButtonText}>Primary Button</Text>
        </View>
        <View
          style={[
            styles.previewButton,
            {
              backgroundColor: colors.secondary[500],
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={styles.previewButtonText}>Secondary Button</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  previewSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  previewCard: {
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewSubtext: {
    fontSize: 12,
  },
  previewButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default LivePreviewCard;
