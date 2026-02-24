/**
 * Verify Email Screen - Mobile
 *
 * Handles email verification token processing.
 * Shows success/error states with appropriate actions.
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { MatrixAuthBackground } from '../../components/matrix';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type VerifyEmailParams = {
  VerifyEmail: { token: string };
};

type Props = {
  navigation: NativeStackNavigationProp<VerifyEmailParams, 'VerifyEmail'>;
  route: RouteProp<VerifyEmailParams, 'VerifyEmail'>;
};

type VerificationState = 'verifying' | 'success' | 'expired' | 'error' | 'already-verified';

// =============================================================================
// COMPONENT
// =============================================================================

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { colors } = useThemeStore();
  const { user, refreshUser } = useAuthStore();
  const token = route.params?.token;

  const [state, setState] = useState<VerificationState>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0), []);

  // Animate on state change
  useEffect(() => {
    if (state !== 'verifying') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state, fadeAnim, scaleAnim]);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('error');
        return;
      }

      try {
        const response = await api.post('/api/v1/auth/verify-email', { token });

        if (response.data.already_verified) {
          setState('already-verified');
        } else {
          setState('success');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Refresh user data to update email_verified status
          await refreshUser?.();
        }
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    verifyToken();
  }, [token, refreshUser]);

  // Resend verification email
  const handleResend = useCallback(async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await api.post('/api/v1/auth/resend-verification', {
        email: user.email,
      });
      setResendSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Silently fail
    } finally {
      setIsResending(false);
    }
  }, [user?.email]);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  }, [navigation]);

  const handleBackToLogin = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  }, [navigation]);

  const renderContent = () => {
    switch (state) {
      case 'verifying':
        return (
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Verifying your email...
            </Text>
          </View>
        );

      case 'success':
        return (
          <Animated.View
            style={[
              styles.centeredContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.statusIcon, { backgroundColor: colors.success + '20' }]}>
              <Text style={styles.statusEmoji}>✅</Text>
            </View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Email Verified!</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              Your email has been successfully verified. You now have full access to all features.
            </Text>
            <TouchableOpacity onPress={handleContinue}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue to App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'already-verified':
        return (
          <Animated.View
            style={[
              styles.centeredContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.statusIcon, { backgroundColor: colors.info + '20' }]}>
              <Text style={styles.statusEmoji}>ℹ️</Text>
            </View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Already Verified</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              Your email has already been verified. You&apos;re all set!
            </Text>
            <TouchableOpacity onPress={handleContinue}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Go to App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'expired':
        return (
          <Animated.View
            style={[
              styles.centeredContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.statusIcon, { backgroundColor: colors.warning + '20' }]}>
              <Text style={styles.statusEmoji}>⏰</Text>
            </View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Link Expired</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              This verification link has expired. Request a new one to verify your email.
            </Text>

            {resendSuccess ? (
              <View
                style={[
                  styles.successBox,
                  { backgroundColor: colors.success + '15', borderColor: colors.success + '40' },
                ]}
              >
                <Text style={[styles.successBoxText, { color: colors.success }]}>
                  ✅ New verification email sent!
                </Text>
                <Text style={[styles.successBoxHint, { color: colors.success + '99' }]}>
                  Check your inbox for the new link.
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {isResending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Resend Verification Email</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleBackToLogin} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'error':
      default:
        return (
          <Animated.View
            style={[
              styles.centeredContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.statusIcon, { backgroundColor: colors.error + '20' }]}>
              <Text style={styles.statusEmoji}>❌</Text>
            </View>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Verification Failed</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              We couldn&apos;t verify your email. The link may be invalid or corrupted.
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatrixAuthBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logo}
          >
            <Text style={styles.logoText}>C</Text>
          </LinearGradient>
          <Text style={[styles.logoTitle, { color: colors.text }]}>CGraph</Text>
        </View>

        {renderContent()}
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
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusEmoji: {
    fontSize: 48,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  successBoxText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  successBoxHint: {
    fontSize: 12,
  },
  linkButton: {
    marginTop: 16,
    padding: 12,
  },
  linkText: {
    fontSize: 14,
  },
});
