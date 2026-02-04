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
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';
import { OAuthButtonGroup, AuthDivider } from '../../components/OAuthButtons';
import { MatrixAuthBackground } from '../../components/matrix';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation values
  const fadeAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const translateYAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(15))).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnims[index], {
          toValue: 0,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(80, animations).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
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

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Validate password complexity (matching backend requirements)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      const missing: string[] = [];
      if (!hasLowercase) missing.push('lowercase letter');
      if (!hasUppercase) missing.push('uppercase letter');
      if (!hasNumber) missing.push('number');
      if (!hasSpecial) missing.push('special character (!@#$%^&*)');
      Alert.alert('Password Requirements', `Password must contain: ${missing.join(', ')}`);
      return;
    }

    // Validate username if provided
    if (username.trim() && username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, username.trim() || null, password);
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

      let errorMessage = 'Could not create account';

      if (err.response?.data) {
        const data = err.response.data;
        // Check for validation details first (most specific)
        if (data.details && typeof data.details === 'object') {
          // Format validation errors nicely
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(data.details)) {
            if (Array.isArray(messages) && messages.length > 0) {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              errorMessages.push(`${fieldName}: ${messages[0]}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
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
        if (__DEV__)
          console.log(
            'Registration error:',
            JSON.stringify(err.response?.data || err.message, null, 2)
          );
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <MatrixAuthBackground />
      <Animated.View style={[styles.overlay, { opacity: glowOpacity }]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
                <Text style={styles.logo}>CGraph</Text>
                <Text style={styles.subtitle}>Create your account</Text>
                <Text style={styles.subtitleSecondary}>
                  Join the next generation of communication
                </Text>
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
                      { opacity: fadeAnims[1], transform: [{ translateY: translateYAnims[1] }] },
                    ]}
                  >
                    <Text style={styles.label}>Email</Text>
                    <LinearGradient
                      colors={
                        focusedField === 'email'
                          ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                          : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.inputGradient,
                        focusedField === 'email' && styles.inputFocused,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#6b7280"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </LinearGradient>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.inputGroup,
                      { opacity: fadeAnims[2], transform: [{ translateY: translateYAnims[2] }] },
                    ]}
                  >
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Username</Text>
                      <Text style={styles.labelHint}>(Optional)</Text>
                    </View>
                    <LinearGradient
                      colors={
                        focusedField === 'username'
                          ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                          : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.inputGradient,
                        focusedField === 'username' && styles.inputFocused,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="Choose a username"
                        placeholderTextColor="#6b7280"
                        value={username}
                        onChangeText={(text) =>
                          setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={30}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </LinearGradient>
                    <Text style={styles.inputHint}>
                      You can set this later. Can be changed every 14 days.
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.inputGroup,
                      { opacity: fadeAnims[3], transform: [{ translateY: translateYAnims[3] }] },
                    ]}
                  >
                    <Text style={styles.label}>Password</Text>
                    <LinearGradient
                      colors={
                        focusedField === 'password'
                          ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                          : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.inputGradient,
                        focusedField === 'password' && styles.inputFocused,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#6b7280"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </LinearGradient>
                    <Text style={styles.inputHint}>
                      Min 8 characters with uppercase, lowercase, number, and special character
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.inputGroup,
                      { opacity: fadeAnims[4], transform: [{ translateY: translateYAnims[4] }] },
                    ]}
                  >
                    <Text style={styles.label}>Confirm Password</Text>
                    <LinearGradient
                      colors={
                        focusedField === 'confirm'
                          ? ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.4)']
                          : ['rgba(17, 24, 39, 0.9)', 'rgba(5, 46, 22, 0.2)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.inputGradient,
                        focusedField === 'confirm' && styles.inputFocused,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#6b7280"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </LinearGradient>
                  </Animated.View>

                  {/* Terms of Service Agreement */}
                  <Animated.View
                    style={[
                      styles.termsRow,
                      { opacity: fadeAnims[5], transform: [{ translateY: translateYAnims[5] }] },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.termsRowInner}
                      onPress={() => setAgreedToTerms(!agreedToTerms)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: agreedToTerms ? '#10b981' : 'rgba(55, 65, 81, 0.8)',
                            backgroundColor: agreedToTerms ? '#10b981' : 'transparent',
                          },
                        ]}
                      >
                        {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text
                          style={styles.termsLink}
                          onPress={() => Linking.openURL('https://cgraph.org/terms')}
                        >
                          Terms of Service
                        </Text>{' '}
                        and{' '}
                        <Text
                          style={styles.termsLink}
                          onPress={() => Linking.openURL('https://cgraph.org/privacy')}
                        >
                          Privacy Policy
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={[
                      {
                        opacity: fadeAnims[6],
                        transform: [{ translateY: translateYAnims[6] }, { scale: buttonScale }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={handleRegister}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857', '#065f46']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                      >
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.loadingText}>Creating account...</Text>
                          </View>
                        ) : (
                          <Text style={styles.buttonText}>Create Account</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* OAuth Divider and Buttons */}
                  <Animated.View
                    style={[
                      {
                        opacity: fadeAnims[7],
                        transform: [{ translateY: translateYAnims[7] }],
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
                  </Animated.View>
                </View>
              </LinearGradient>

              {/* Footer */}
              <Animated.View
                style={[
                  styles.footer,
                  { opacity: fadeAnims[7], transform: [{ translateY: translateYAnims[7] }] },
                ]}
              >
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
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
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 2,
  },
  labelHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  inputGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.8)',
  },
  inputFocused: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    color: '#6b7280',
  },
  termsRow: {
    marginTop: 8,
  },
  termsRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#9ca3af',
  },
  termsLink: {
    fontWeight: '600',
    color: '#10b981',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'rgba(16, 185, 129, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
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
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
