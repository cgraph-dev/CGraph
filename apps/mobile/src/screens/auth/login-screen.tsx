/**
 * Login screen for user authentication.
 * @module screens/auth/login-screen
 */
import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore, useThemeStore } from '@/stores';
import { useWalletConnect } from '@/lib/wallet';
import { AuthStackParamList } from '../../types';
import { OAuthButtonGroup, AuthDivider } from '../../components/o-auth-buttons';
import { MatrixAuthBackground } from '../../components/matrix';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

/** Login screen for user authentication. */
export default function LoginScreen({ navigation }: Props) {
  const { colors: _colors } = useThemeStore();
  const { login } = useAuthStore();
  const { connect: connectWallet } = useWalletConnect();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<'identifier' | 'password' | null>(null);

  // Animation values for staggered entrance
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const translateYAnims = useRef([
    new Animated.Value(15),
    new Animated.Value(15),
    new Animated.Value(15),
    new Animated.Value(15),
    new Animated.Value(15),
    new Animated.Value(15),
  ]).current;

  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Staggered entrance animations
    const animations = fadeAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: durations.smooth.ms,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnims[index], {
          toValue: 0,
          duration: durations.smooth.ms,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(100, animations).start();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email/username and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(identifier, password);

      // Backend requires 2FA — navigate to TOTP screen
      if (result?.twoFactorRequired) {
        navigation.navigate('TwoFactorVerify', {
          twoFactorToken: result.twoFactorToken,
        });
        return;
      }
      // Normal login success — auth store sets isAuthenticated, root navigator handles transition
    } catch (error: unknown) {
      // Backend returns errors in multiple formats:
      // - {error: "message"} for simple errors
      // - {error: {message: "..."}} for complex errors
      // - {error: "...", message: "...", details: {...}} for validation
      // - Network errors have no response
       
      const err = error as {
        response?: {
          data?: {
            error?: string | { message?: string };
            message?: string;
            details?: Record<string, string[]>;
          };
        };
        message?: string;
      };

      let errorMessage = 'Invalid credentials';

      if (err.response?.data) {
        const { data } = err.response;
        // Check for validation details first (most specific)
        if (data.details && typeof data.details === 'object') {
          const firstField = Object.keys(data.details)[0];
          if (firstField && Array.isArray(data.details[firstField])) {
            errorMessage = `${firstField}: ${data.details[firstField][0]}`;
          }
        } else if (typeof data.error === 'object' && data.error?.message) {
          // Complex error object
          errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
          // Simple error string
          errorMessage = data.error;
        } else if (data.message) {
          // Fallback to message field
          errorMessage = data.message;
        }
      } else if (err.message?.includes('Network')) {
        // Network connectivity issue
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }

      // Log for debugging in development
      if (__DEV__) {
        console.warn('Login error:', JSON.stringify(err.response?.data || err.message, null, 2));
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
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
                  opacity: fadeAnims[0],
                  transform: [{ translateY: translateYAnims[0] }],
                },
              ]}
            >
              <Image
                 
                source={require('../../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Welcome back</Text>
              <Text style={styles.subtitleSecondary}>Sign in to your account to continue</Text>
            </Animated.View>

            {/* Form Container with matrix-card styling */}
            <LinearGradient
              colors={['rgba(17, 24, 39, 0.95)', 'rgba(5, 46, 22, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formContainer}
            >
              <View style={styles.form}>
                <Animated.View
                  style={[
                    styles.inputGroup,
                    {
                      opacity: fadeAnims[1],
                      transform: [{ translateY: translateYAnims[1] }],
                    },
                  ]}
                >
                  <Text style={styles.label}>Email or Username</Text>
                  <LinearGradient
                    colors={
                      isFocused === 'identifier'
                        ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                        : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.inputGradient,
                      isFocused === 'identifier' && styles.inputFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com or username"
                      placeholderTextColor="#6b7280"
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsFocused('identifier')}
                      onBlur={() => setIsFocused(null)}
                    />
                  </LinearGradient>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.inputGroup,
                    {
                      opacity: fadeAnims[2],
                      transform: [{ translateY: translateYAnims[2] }],
                    },
                  ]}
                >
                  <Text style={styles.label}>Password</Text>
                  <LinearGradient
                    colors={
                      isFocused === 'password'
                        ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                        : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.inputGradient, isFocused === 'password' && styles.inputFocused]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused(null)}
                    />
                  </LinearGradient>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.forgotContainer,
                    {
                      opacity: fadeAnims[3],
                      transform: [{ translateY: translateYAnims[3] }],
                    },
                  ]}
                >
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotPassword}>Forgot password?</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      opacity: fadeAnims[4],
                      transform: [{ translateY: translateYAnims[4] }, { scale: buttonScale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['rgba(16, 185, 129, 0.18)', 'rgba(139, 92, 246, 0.18)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.ctaButton, isLoading && styles.buttonDisabled]}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.loadingText}>Signing in...</Text>
                        </View>
                      ) : (
                        <Text style={styles.buttonText}>Sign in →</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* OAuth Divider and Buttons */}
                <Animated.View
                  style={[
                    {
                      opacity: fadeAnims[5],
                      transform: [{ translateY: translateYAnims[5] }],
                    },
                  ]}
                >
                  <AuthDivider text="Or continue with" />

                  <OAuthButtonGroup
                    variant="icon"
                    providers={['google', 'apple', 'facebook', 'tiktok']}
                    onSuccess={() => {
                      // Auth context will handle navigation
                    }}
                    onError={(error) => {
                      if (!error.message.includes('cancelled')) {
                        console.error('OAuth error:', error);
                      }
                    }}
                  />

                  {/* Wallet Connect Button */}
                  <TouchableOpacity
                    style={styles.walletButton}
                    onPress={connectWallet}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.15)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.walletButtonGradient}
                    >
                      <Text style={styles.walletButtonIcon}>⬡</Text>
                      <Text style={styles.walletButtonText}>Connect Wallet</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnims[5],
                  transform: [{ translateY: translateYAnims[5] }],
                },
              ]}
            >
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

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
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
    borderRadius: 32,
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
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
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
  ctaButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.34)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  buttonDisabled: {
    opacity: 0.7,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  walletButton: {
    marginTop: 16,
  },
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 10,
  },
  walletButtonIcon: {
    fontSize: 18,
    color: '#8b5cf6',
  },
  walletButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c4b5fd',
  },
});
