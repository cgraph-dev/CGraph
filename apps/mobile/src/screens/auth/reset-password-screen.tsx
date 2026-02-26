/**
 * Reset Password Screen - Mobile
 *
 * Token-based password reset with:
 * - Password strength meter
 * - Confirmation matching
 * - Success/error states
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Keyboard,
  _Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { MatrixAuthBackground } from '../../components/matrix';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type ResetPasswordParams = {
  ResetPassword: { token: string };
};

type Props = {
  navigation: NativeStackNavigationProp<ResetPasswordParams, 'ResetPassword'>;
  route: RouteProp<ResetPasswordParams, 'ResetPassword'>;
};

type ResetState = 'validating' | 'form' | 'success' | 'expired' | 'error';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f87171', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return {
    score,
    label: labels[score] || 'Very Weak',
    color: colors[score] || '#ef4444',
    requirements,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 *
 */
export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors } = useThemeStore();
  const token = route.params?.token;

  const [state, setState] = useState<ResetState>('validating');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const shakeAnim = useMemo(() => new Animated.Value(0), []);

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = strength.score >= 4 && passwordsMatch && !isLoading;

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: durations.smooth.ms,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, state]);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setState('expired');
        return;
      }

      try {
        await api.post('/api/v1/auth/reset-password/validate', { token });
        setState('form');
      } catch (error: unknown) {
         
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage('Unable to validate reset link.');
        }
      }
    }

    validateToken();
  }, [token]);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: durations.stagger.ms, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: durations.stagger.ms, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: durations.stagger.ms, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: durations.stagger.ms, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();

    if (!canSubmit) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await api.post('/api/v1/auth/reset-password/confirm', {
        token,
        password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState('success');
    } catch (error: unknown) {
       
      const apiError = error as { response?: { data?: { message?: string } } };
      setErrorMessage(
        apiError.response?.data?.message || 'Failed to reset password. Please try again.'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
    } finally {
      setIsLoading(false);
    }
  }, [canSubmit, token, password, shake]);

  const handleBackToLogin = useCallback(() => {
    navigation.reset({
      index: 0,
       
      routes: [{ name: 'Login' as never }],
    });
  }, [navigation]);

  const handleRequestNewLink = useCallback(() => {
     
    navigation.navigate('ForgotPassword' as never);
  }, [navigation]);

  // Render validating state
  const renderValidating = () => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        Validating your reset link...
      </Text>
    </View>
  );

  // Render expired state
  const renderExpired = () => (
    <Animated.View style={[styles.centeredContent, { opacity: fadeAnim }]}>
      <View style={[styles.statusIcon, { backgroundColor: colors.error + '20' }]}>
        <Text style={styles.statusEmoji}>⏰</Text>
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>Link Expired</Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        This password reset link has expired or has already been used.
      </Text>
      <TouchableOpacity onPress={handleRequestNewLink}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Request New Link</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render success state
  const renderSuccess = () => (
    <Animated.View style={[styles.centeredContent, { opacity: fadeAnim }]}>
      <View style={[styles.statusIcon, { backgroundColor: colors.success + '20' }]}>
        <Text style={styles.statusEmoji}>✅</Text>
      </View>
      <Text style={[styles.statusTitle, { color: colors.text }]}>Password Reset!</Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        Your password has been successfully reset. You can now log in.
      </Text>
      <TouchableOpacity onPress={handleBackToLogin}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue to Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render form
  const renderForm = () => (
    <Animated.View 
      style={[
        styles.formContent, 
        { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerIcon}
        >
          <Text style={styles.headerEmoji}>🔐</Text>
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create New Password
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Enter a strong password to secure your account
        </Text>
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.input, { color: colors.text }]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {/* Strength Meter */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  { 
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: strength.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        )}

        {/* Requirements */}
        {password.length > 0 && (
          <View style={styles.requirements}>
            {[
              { key: 'minLength' as const, label: '8+ characters' },
              { key: 'hasUppercase' as const, label: 'Uppercase' },
              { key: 'hasLowercase' as const, label: 'Lowercase' },
              { key: 'hasNumber' as const, label: 'Number' },
              { key: 'hasSpecial' as const, label: 'Special char' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.requirementItem}>
                <Text style={{ fontSize: 10 }}>
                  {strength.requirements[key] ? '✅' : '⬜'}
                </Text>
                <Text
                  style={[
                    styles.requirementText,
                    { color: strength.requirements[key] ? colors.success : colors.textTertiary },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Confirm Password
        </Text>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: confirmPassword
                ? passwordsMatch
                  ? colors.success
                  : colors.error
                : colors.border,
            },
          ]}
        >
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            style={[styles.input, { color: colors.text }]}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Text style={{ fontSize: 18 }}>{showConfirmPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>
        {confirmPassword && !passwordsMatch && (
          <Text style={[styles.errorHint, { color: colors.error }]}>
            Passwords do not match
          </Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit || isLoading}>
        <LinearGradient
          colors={canSubmit ? [colors.primary, colors.secondary] : [colors.border, colors.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Reset Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity onPress={handleBackToLogin} style={styles.linkButton}>
        <Text style={[styles.linkText, { color: colors.textSecondary }]}>
          Remember your password?{' '}
          <Text style={{ color: colors.primary }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatrixAuthBackground />
      <SafeAreaView style={styles.safeArea}>
        {state === 'validating' && renderValidating()}
        {state === 'expired' && renderExpired()}
        {state === 'error' && renderExpired()}
        {state === 'success' && renderSuccess()}
        {state === 'form' && renderForm()}
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centeredContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  formContent: {
    paddingVertical: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusEmoji: {
    fontSize: 40,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requirementText: {
    fontSize: 11,
  },
  errorHint: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});
