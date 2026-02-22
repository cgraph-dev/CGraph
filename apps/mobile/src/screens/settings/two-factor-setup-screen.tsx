/**
 * Two-Factor Authentication Setup Screen - Mobile
 *
 * Step-by-step wizard for enabling 2FA with:
 * - QR code scanning
 * - Manual entry code
 * - Backup codes generation
 * - Verification step
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../contexts/theme-context';
import { SettingsStackParamList } from '../../types';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'TwoFactorSetup'>;
};

interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

type SetupStep = 'intro' | 'scan' | 'verify' | 'backup' | 'complete';

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { id: 'intro', label: 'Start' },
  { id: 'scan', label: 'Scan' },
  { id: 'verify', label: 'Verify' },
  { id: 'backup', label: 'Backup' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function TwoFactorSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [step, setStep] = useState<SetupStep>('intro');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<TextInput[]>([]);

  // Update progress animation
  useEffect(() => {
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    Animated.spring(progressAnim, {
      toValue: stepIndex / (STEPS.length - 1),
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [step, progressAnim]);

  // Generate 2FA secret on entering scan step
  useEffect(() => {
    async function generateSecret() {
      if (step !== 'scan' || setupData) return;

      setIsLoading(true);
      try {
        const response = await api.post('/api/v1/auth/2fa/setup');
        setSetupData(response.data);
      } catch {
        setError('Failed to generate 2FA secret. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    generateSecret();
  }, [step, setupData]);

  // Step transition animation
  const animateTransition = useCallback(
    (nextStep: SetupStep) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  // Handle verification code input
  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        // Handle paste
        const digits = value.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...verificationCode];
        digits.forEach((digit, i) => {
          if (index + i < 6) newCode[index + i] = digit;
        });
        setVerificationCode(newCode);
        const nextIndex = Math.min(index + digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      } else if (/^\d$/.test(value) || value === '') {
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        if (value && index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    },
    [verificationCode]
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !verificationCode[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [verificationCode]
  );

  // Verify the code
  const handleVerify = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/2fa/verify', { code });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTransition('backup');
    } catch {
      setError('Invalid code. Please try again.');
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, animateTransition]);

  // Copy helpers
  const copySecret = useCallback(async () => {
    if (setupData?.secret) {
      await Clipboard.setStringAsync(setupData.secret);
      setCopiedSecret(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [setupData?.secret]);

  const copyBackupCodes = useCallback(async () => {
    if (setupData?.backupCodes) {
      await Clipboard.setStringAsync(setupData.backupCodes.join('\n'));
      setCopiedBackup(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  }, [setupData?.backupCodes]);

  // Finalize setup
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/2fa/enable');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTransition('complete');
    } catch {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [animateTransition]);

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <View style={styles.stepContent}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.stepIcon}
            >
              <Text style={styles.stepEmoji}>🔐</Text>
            </LinearGradient>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Enable Two-Factor Authentication
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Add an extra layer of security to your account
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: '🔒', title: 'Enhanced Security', desc: 'Protect from unauthorized access' },
                { icon: '📱', title: 'Authenticator App', desc: 'Use Google Authenticator or similar' },
                { icon: '💾', title: 'Backup Codes', desc: 'Recovery codes for emergencies' },
              ].map((item) => (
                <View
                  key={item.title}
                  style={[styles.featureCard, { backgroundColor: colors.surface }]}
                >
                  <Text style={styles.featureIcon}>{item.icon}</Text>
                  <View style={styles.featureInfo}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                animateTransition('scan');
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

      case 'scan':
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
                  onPress={copySecret}
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
                    animateTransition('verify');
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

      case 'verify':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Verify Setup</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code from your authenticator
            </Text>

            {/* Code Input */}
            <View style={styles.codeInputContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: digit ? colors.primary : colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Error */}
            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleVerify}
              disabled={isLoading || verificationCode.some((d) => !d)}
            >
              <LinearGradient
                colors={
                  verificationCode.every((d) => d)
                    ? [colors.primary, colors.secondary]
                    : [colors.border, colors.border]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.primaryButton,
                  !verificationCode.every((d) => d) && styles.buttonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => animateTransition('scan')}
              style={styles.backLink}
            >
              <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>
                Back to QR Code
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'backup':
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
                {setupData?.backupCodes.map((code, index) => (
                  <View
                    key={index}
                    style={[styles.backupCodeItem, { backgroundColor: colors.background }]}
                  >
                    <Text style={[styles.backupCodeText, { color: colors.textSecondary }]}>
                      {code}
                    </Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={copyBackupCodes}
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

            <TouchableOpacity onPress={handleComplete} disabled={isLoading}>
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

      case 'complete':
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
                navigation.goBack();
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

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        {step !== 'complete' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
            {renderStep()}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepEmoji: {
    fontSize: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
  },
  primaryButton: {
    width: SCREEN_WIDTH - 48,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
  },
  qrContainer: {
    marginBottom: 24,
  },
  qrBackground: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  manualLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  secretText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyIcon: {
    fontSize: 18,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  warningEmoji: {
    fontSize: 32,
  },
  backupCodesBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  backupCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  backupCodeItem: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupCodeText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 14,
  },
  warningBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
  },
});
