/**
 * QR code scan step for 2FA setup wizard.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TwoFactorSetupData, SCREEN_WIDTH } from './two-factor-types';

interface ScanStepProps {
  colors: Record<string, string>;
  isLoading: boolean;
  setupData: TwoFactorSetupData | null;
  copiedSecret: boolean;
  onCopySecret: () => void;
  onContinue: () => void;
}

export function ScanStep({
  colors,
  isLoading,
  setupData,
  copiedSecret,
  onCopySecret,
  onContinue,
}: ScanStepProps) {
  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Scan QR Code</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Scan this code with your authenticator app
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : setupData ? (
        <>
          {/* QR Code */}
          <View style={styles.qrContainer}>
            <View style={styles.qrBackground}>
              <Image
                source={{ uri: setupData.qrCodeUrl }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Manual Entry */}
          <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>
            Or enter this code manually:
          </Text>
          <TouchableOpacity
            onPress={onCopySecret}
            style={[styles.secretBox, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.secretText, { color: colors.primary }]}>
              {setupData.secret.match(/.{1,4}/g)?.join(' ')}
            </Text>
            <Text style={styles.copyIcon}>{copiedSecret ? '✅' : '📋'}</Text>
          </TouchableOpacity>

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
              <Text style={styles.primaryButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { alignItems: 'center' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  loader: { marginVertical: 40 },
  qrContainer: { marginBottom: 24 },
  qrBackground: { backgroundColor: '#fff', padding: 16, borderRadius: 16 },
  qrCode: { width: 200, height: 200 },
  manualLabel: { fontSize: 14, marginBottom: 8 },
  secretBox: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderRadius: 12, marginBottom: 32, gap: 12,
  },
  secretText: {
    flex: 1, fontSize: 16, fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center',
  },
  copyIcon: { fontSize: 18 },
  primaryButton: {
    width: SCREEN_WIDTH - 48, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
