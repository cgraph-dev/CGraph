/**
 * Completion step for 2FA setup wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SCREEN_WIDTH } from './two-factor-types';

interface CompleteStepProps {
  colors: Record<string, string>;
  onDone: () => void;
}

export function CompleteStep({ colors, onDone }: CompleteStepProps) {
  return (
    <View style={styles.stepContent}>
      <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
        <Text style={styles.successEmoji}>✅</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>2FA Enabled!</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Your account is now protected with two-factor authentication.
      </Text>

      <TouchableOpacity
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDone();
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { alignItems: 'center' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successEmoji: { fontSize: 40 },
  primaryButton: {
    width: SCREEN_WIDTH - 48, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
