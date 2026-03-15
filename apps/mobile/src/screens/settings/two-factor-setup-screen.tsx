/**
 * Two-Factor Authentication setup wizard - Orchestrator.
 * Delegates step UI to sub-components in ./two-factor-setup/
 * @module screens/settings/two-factor-setup-screen
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { durations } from '@cgraph/animation-constants';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';
import {
  TwoFactorSetupData,
  SetupStep,
  STEPS,
  SCREEN_WIDTH,
} from './two-factor-setup/two-factor-types';
import { IntroStep } from './two-factor-setup/intro-step';
import { ScanStep } from './two-factor-setup/scan-step';
import { VerifyStep } from './two-factor-setup/verify-step';
import { BackupStep } from './two-factor-setup/backup-step';
import { CompleteStep } from './two-factor-setup/complete-step';

const STEP_ORDER: SetupStep[] = ['intro', 'scan', 'verify', 'backup', 'complete'];

const COLORS: Record<string, string> = {
  text: '#ffffff',
  textSecondary: '#9ca3af',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  surface: '#1f2937',
  background: '#111827',
  success: '#10b981',
  warning: '#f59e0b',
};

/**
 * Two Factor Setup Screen component.
 *
 */
export default function TwoFactorSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: stepIndex / (STEP_ORDER.length - 1),
      duration: durations.normal.ms,
      useNativeDriver: false,
    }).start();
  }, [stepIndex, progressAnim]);

  const goToStep = useCallback(
    (step: SetupStep) => {
      HapticFeedback.light();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: durations.fast.ms,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(step);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: durations.fast.ms,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  const generateSecret = useCallback(async () => {
    try {
      const response = await api.post('/api/v1/auth/2fa/generate');
      setSetupData(response.data);
      goToStep('scan');
    } catch (error) {
      console.error('[2FA] Generate error:', error);
      Alert.alert('Error', 'Could not generate 2FA secret. Please try again.');
    }
  }, [goToStep]);

  const handleVerify = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) return;
    try {
      setIsVerifying(true);
      HapticFeedback.medium();
      const response = await api.post('/api/v1/auth/2fa/verify', {
        code,
        secret: setupData?.secret,
      });
      if (response.data.backup_codes) setBackupCodes(response.data.backup_codes);
      HapticFeedback.success();
      goToStep('backup');
    } catch (error) {
      console.error('[2FA] Verify error:', error);
      HapticFeedback.error();
      Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [verificationCode, setupData, goToStep]);

  const handleComplete = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/2fa/enable');
      HapticFeedback.success();
      goToStep('complete');
    } catch (error) {
      console.error('[2FA] Enable error:', error);
      Alert.alert('Error', 'Could not enable 2FA. Please try again.');
    }
  }, [goToStep]);

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newCode = [...verificationCode];
      newCode[index] = value.slice(-1);
      setVerificationCode(newCode);
      if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
    },
    [verificationCode]
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !verificationCode[index] && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
      }
    },
    [verificationCode]
  );

  const copySecret = useCallback(async () => {
    if (!setupData?.secret) return;
    await Clipboard.setStringAsync(setupData.secret);
    setCopiedSecret(true);
    HapticFeedback.light();
    Alert.alert('Copied', 'Secret key copied to clipboard');
  }, [setupData]);

  const copyBackupCodes = useCallback(async () => {
    await Clipboard.setStringAsync(backupCodes.join('\n'));
    setCopiedBackup(true);
    HapticFeedback.light();
    Alert.alert('Copied', 'Backup codes copied to clipboard');
  }, [backupCodes]);

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return <IntroStep colors={COLORS} onContinue={generateSecret} />;
      case 'scan':
        return (
          <ScanStep
            colors={COLORS}
            isLoading={!setupData}
            setupData={setupData}
            copiedSecret={copiedSecret}
            onCopySecret={copySecret}
            onContinue={() => goToStep('verify')}
          />
        );
      case 'verify':
        return (
          <VerifyStep
            colors={COLORS}
            verificationCode={verificationCode}
            isLoading={isVerifying}
            error=""
            inputRefs={codeInputRefs}
            onCodeChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            onVerify={handleVerify}
            onBack={() => goToStep('scan')}
          />
        );
      case 'backup':
        return (
          <BackupStep
            colors={COLORS}
            backupCodes={backupCodes}
            isLoading={false}
            copiedBackup={copiedBackup}
            onCopyBackupCodes={copyBackupCodes}
            onComplete={handleComplete}
          />
        );
      case 'complete':
        return <CompleteStep colors={COLORS} onDone={() => navigation.goBack()} />;
      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              HapticFeedback.light();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
            <Text style={styles.headerSubtitle}>
              Step {stepIndex + 1} of {STEP_ORDER.length} — {STEPS[currentStep].title}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stepDots}>
            {STEP_ORDER.map((s, i) => (
              <View key={s} style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        {/* Step content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>{renderStep()}</Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  progressContainer: { paddingHorizontal: 16, marginBottom: 8 },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 2 },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: { backgroundColor: '#8b5cf6' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
});
