/**
 * Intro step for 2FA setup wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SCREEN_WIDTH } from './two-factor-types';

interface IntroStepProps {
  colors: Record<string, string>;
  onContinue: () => void;
}

/** Description. */
/** Intro Step component. */
export function IntroStep({ colors, onContinue }: IntroStepProps) {
  const FEATURES = [
    { icon: '🔒', title: 'Enhanced Security', desc: 'Protect from unauthorized access' },
    { icon: '📱', title: 'Authenticator App', desc: 'Use Google Authenticator or similar' },
    { icon: '💾', title: 'Backup Codes', desc: 'Recovery codes for emergencies' },
  ];

  return (
    <View style={styles.stepContent}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.stepIcon}>
        <Text style={styles.stepEmoji}>🔐</Text>
      </LinearGradient>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Enable Two-Factor Authentication
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Add an extra layer of security to your account
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map((item) => (
          <View key={item.title} style={[styles.featureCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.featureIcon}>{item.icon}</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onContinue();
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { alignItems: 'center' },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepEmoji: { fontSize: 40 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  featureList: { width: '100%', gap: 12, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  featureIcon: { fontSize: 24 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  featureDesc: { fontSize: 13 },
  primaryButton: {
    width: SCREEN_WIDTH - 48,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
