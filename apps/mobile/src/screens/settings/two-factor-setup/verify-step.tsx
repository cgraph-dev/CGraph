/**
 * Verification code entry step for 2FA setup wizard.
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_WIDTH } from './two-factor-types';

interface VerifyStepProps {
  colors: Record<string, string>;
  verificationCode: string[];
  isLoading: boolean;
  error: string;
  inputRefs: React.MutableRefObject<TextInput[]>;
  onCodeChange: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
  onVerify: () => void;
  onBack: () => void;
}

export function VerifyStep({
  colors,
  verificationCode,
  isLoading,
  error,
  inputRefs,
  onCodeChange,
  onKeyPress,
  onVerify,
  onBack,
}: VerifyStepProps) {
  const allFilled = verificationCode.every((d) => d);

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
            onChangeText={(value) => onCodeChange(index, value)}
            onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
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
        onPress={onVerify}
        disabled={isLoading || !allFilled}
      >
        <LinearGradient
          colors={
            allFilled
              ? [colors.primary, colors.secondary]
              : [colors.border, colors.border]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.primaryButton, !allFilled && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.backLink}>
        <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>
          Back to QR Code
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: { alignItems: 'center' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  codeInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  codeInput: {
    width: 48, height: 56, borderWidth: 2, borderRadius: 12,
    textAlign: 'center', fontSize: 24, fontWeight: 'bold',
  },
  errorText: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  primaryButton: {
    width: SCREEN_WIDTH - 48, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backLink: { marginTop: 16, padding: 8 },
  backLinkText: { fontSize: 14 },
});
