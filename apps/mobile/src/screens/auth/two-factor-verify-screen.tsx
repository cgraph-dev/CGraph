/**
 * Two-Factor Verification Screen — Mobile
 *
 * Collects a 6-digit TOTP code (or backup code) to complete
 * login when the user has 2FA enabled. Reached via navigation
 * from the login screen after a 2fa_required response.
 *
 * @module screens/auth/two-factor-verify-screen
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore, useThemeStore } from '@/stores';
import { AuthStackParamList } from '../../types';
import { MatrixAuthBackground } from '../../components/matrix';

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'TwoFactorVerify'>;
  route: RouteProp<AuthStackParamList, 'TwoFactorVerify'>;
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Two-factor verification screen for login.
 */
export default function TwoFactorVerifyScreen({ navigation, route }: Props) {
  const { colors } = useThemeStore();
  const { verifyLoginTwoFactor } = useAuthStore();
  const twoFactorToken = route.params?.twoFactorToken;

  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const translateYAnim = useMemo(() => new Animated.Value(15), []);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.smooth.ms,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: durations.smooth.ms,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: durations.loop.ms,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: durations.loop.ms,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [fadeAnim, translateYAnim, glowOpacity]);

  const handleCodeChange = (value: string) => {
    if (useBackupCode) {
      setCode(value);
      return;
    }

    // TOTP: numeric only, max 6 digits
    const numeric = value.replace(/\D/g, '').slice(0, 6);
    setCode(numeric);

    // Auto-submit when 6 digits entered
    if (numeric.length === 6) {
      handleVerify(numeric);
    }
  };

  const handleVerify = async (submittedCode?: string) => {
    const codeToVerify = (submittedCode || code).trim();
    if (!codeToVerify || !twoFactorToken) return;

    setIsLoading(true);
    try {
      await verifyLoginTwoFactor(twoFactorToken, codeToVerify);
      // On success: authStore sets isAuthenticated=true, root navigator switches to Main
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const err = error as {
        response?: {
          data?: {
            error?: string | { message?: string };
            message?: string;
          };
        };
        message?: string;
      };

      let errorMessage = 'Invalid verification code';

      if (err.response?.data) {
        const { data } = err.response;
        if (typeof data.error === 'object' && data.error?.message) {
          errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }

      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBackupCode = () => {
    setCode('');
    setUseBackupCode((prev) => !prev);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Matrix Background Effect */}
      <MatrixAuthBackground theme="matrix-green" />

      {/* Dark overlay with subtle green gradient */}
      <Animated.View style={[styles.overlay, { opacity: glowOpacity }]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateYAnim }],
                },
              ]}
            >
              <Text style={styles.logo}>🔐</Text>
              <Text style={styles.subtitle}>Two-Factor Authentication</Text>
              <Text style={styles.subtitleSecondary}>
                {useBackupCode
                  ? 'Enter one of your backup codes to sign in.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </Text>
            </Animated.View>

            {/* Form Container */}
            <LinearGradient
              colors={['rgba(17, 24, 39, 0.95)', 'rgba(5, 46, 22, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formContainer}
            >
              <View style={styles.form}>
                {/* Code Input */}
                <Animated.View
                  style={[
                    styles.inputGroup,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateYAnim }],
                    },
                  ]}
                >
                  <Text style={styles.label}>
                    {useBackupCode ? 'Backup code' : 'Verification code'}
                  </Text>
                  <LinearGradient
                    colors={
                      isFocused
                        ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                        : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.inputGradient, isFocused && styles.inputFocused]}
                  >
                    <TextInput
                      ref={inputRef}
                      style={[styles.input, !useBackupCode && styles.codeInput]}
                      placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                      placeholderTextColor="#6b7280"
                      value={code}
                      onChangeText={handleCodeChange}
                      keyboardType={useBackupCode ? 'default' : 'number-pad'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={useBackupCode ? 20 : 6}
                      editable={!isLoading}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </LinearGradient>
                </Animated.View>

                {/* Verify Button */}
                <Animated.View
                  style={[
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateYAnim }, { scale: buttonScale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => handleVerify()}
                    disabled={isLoading || !code.trim()}
                  >
                    <LinearGradient
                      colors={['#059669', '#047857', '#065f46']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.button, (isLoading || !code.trim()) && styles.buttonDisabled]}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                      ) : (
                        <Text style={styles.buttonText}>Verify</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Toggle backup code */}
                <Animated.View
                  style={[
                    styles.toggleContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateYAnim }],
                    },
                  ]}
                >
                  <TouchableOpacity onPress={toggleBackupCode} disabled={isLoading}>
                    <Text style={styles.toggleText}>
                      {useBackupCode
                        ? 'Use authenticator app instead'
                        : 'Use a backup code instead'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>

            {/* Back to Login */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: translateYAnim }],
                },
              ]}
            >
              <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                <Text style={styles.footerLink}>← Back to login</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 46, 22, 0.1)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  subtitleSecondary: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: 'rgba(16, 185, 129, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 2,
  },
  inputGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.8)',
  },
  inputFocused: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: 'rgba(16, 185, 129, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  codeInput: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
    letterSpacing: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  toggleText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});
