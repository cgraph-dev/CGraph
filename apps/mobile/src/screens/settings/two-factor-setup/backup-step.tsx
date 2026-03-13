/**
 * Backup codes step for 2FA setup wizard.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_WIDTH } from './two-factor-types';

interface BackupStepProps {
  colors: Record<string, string>;
  backupCodes: string[];
  isLoading: boolean;
  copiedBackup: boolean;
  onCopyBackupCodes: () => void;
  onComplete: () => void;
}

/** Description. */
/** Backup Step component. */
export function BackupStep({
  colors,
  backupCodes,
  isLoading,
  copiedBackup,
  onCopyBackupCodes,
  onComplete,
}: BackupStepProps) {
  return (
    <View style={styles.stepContent}>
      <View style={[styles.warningIcon, { backgroundColor: colors.warning + '20' }]}>
        <Text style={styles.warningEmoji}>⚠️</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Save Backup Codes</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Store these codes safely. You&apos;ll need them if you lose access.
      </Text>

      {/* Backup Codes */}
      <View style={[styles.backupCodesBox, { backgroundColor: colors.surface }]}>
        <View style={styles.backupCodesGrid}>
          {backupCodes.map((code, index) => (
            <View
              key={index}
              style={[styles.backupCodeItem, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.backupCodeText, { color: colors.textSecondary }]}>{code}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={onCopyBackupCodes}
          style={[styles.copyButton, { borderColor: colors.border }]}
        >
          <Text style={{ fontSize: 16 }}>{copiedBackup ? '✅' : '📋'}</Text>
          <Text style={[styles.copyButtonText, { color: colors.textSecondary }]}>
            {copiedBackup ? 'Copied!' : 'Copy All Codes'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.warningBox,
          { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' },
        ]}
      >
        <Text style={[styles.warningText, { color: colors.warning }]}>
          Each code can only be used once. Store them in a secure location.
        </Text>
      </View>

      <TouchableOpacity onPress={onComplete} disabled={isLoading}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>I&apos;ve Saved My Codes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { alignItems: 'center' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  warningEmoji: { fontSize: 32 },
  backupCodesBox: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 16 },
  backupCodesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  backupCodeItem: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupCodeText: { fontFamily: 'monospace', fontSize: 14 },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
  },
  copyButtonText: { fontSize: 14 },
  warningBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  primaryButton: {
    width: SCREEN_WIDTH - 48,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
