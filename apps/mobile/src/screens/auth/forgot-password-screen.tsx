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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme-context';
import api from '../../lib/api';
import { AuthStackParamList } from '../../types';
import { MatrixAuthBackground } from '../../components/matrix';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnims = useRef([
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
  ]).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnims[index], {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(100, animations).start();

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

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setSent(true);
    } catch (error: unknown) {
      const err = error as any;
      Alert.alert('Error', err?.response?.data?.message || 'Could not send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <MatrixAuthBackground theme="matrix-green" />
        <Animated.View style={[styles.overlay, { opacity: glowOpacity }]} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContent}>
            <LinearGradient
              colors={['rgba(17, 24, 39, 0.95)', 'rgba(5, 46, 22, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successCard}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={48} color="#10b981" />
              </View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.description}>We've sent a password reset link to {email}</Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Login')}>
                <LinearGradient
                  colors={['#059669', '#047857', '#065f46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Back to Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MatrixAuthBackground theme="matrix-green" />
      <Animated.View style={[styles.overlay, { opacity: glowOpacity }]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Back Button */}
            <Animated.View
              style={[
                {
                  opacity: fadeAnims[0],
                  transform: [{ translateY: translateYAnims[0] }],
                },
              ]}
            >
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* Header */}
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnims[1],
                  transform: [{ translateY: translateYAnims[1] }],
                },
              ]}
            >
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.description}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </Animated.View>

            {/* Form */}
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
                      opacity: fadeAnims[2],
                      transform: [{ translateY: translateYAnims[2] }],
                    },
                  ]}
                >
                  <Text style={styles.label}>Email</Text>
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
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </LinearGradient>
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      opacity: fadeAnims[3],
                      transform: [{ translateY: translateYAnims[3] }, { scale: buttonScale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleSubmit}
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
                          <Text style={styles.loadingText}>Sending...</Text>
                        </View>
                      ) : (
                        <Text style={styles.buttonText}>Send Reset Link</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>
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
  },
  successContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(16, 185, 129, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#9ca3af',
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
});
