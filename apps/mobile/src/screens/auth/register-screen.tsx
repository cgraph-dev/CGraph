/**
 * Registration screen for new user account creation.
 * @module screens/auth/register-screen
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { AuthStackParamList } from '../../types';
import { OAuthButtonGroup, AuthDivider } from '../../components/o-auth-buttons';
import { MatrixAuthBackground } from '../../components/matrix';
import { useRegister } from './register-screen/use-register';
import { RegisterFormFields } from './register-screen/components/register-form-fields';
import { styles } from './register-screen/styles';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

/**
 * Registers screen.
 *
 */
export default function RegisterScreen({ navigation }: Props) {
  const { _colors } = useThemeStore();
  const reg = useRegister();

  const fadeAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const translateYAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(15))).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: durations.smooth.ms,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnims[index], {
          toValue: 0,
          duration: durations.smooth.ms,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(80, animations).start();
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

  const handlePressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

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
                  { opacity: fadeAnims[0], transform: [{ translateY: translateYAnims[0] }] },
                ]}
              >
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  source={require('../../../assets/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.subtitle}>Create your account</Text>
                <Text style={styles.subtitleSecondary}>
                  Join the next generation of communication
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
                  <RegisterFormFields
                    email={reg.email}
                    setEmail={reg.setEmail}
                    username={reg.username}
                    setUsername={reg.setUsername}
                    password={reg.password}
                    setPassword={reg.setPassword}
                    confirmPassword={reg.confirmPassword}
                    setConfirmPassword={reg.setConfirmPassword}
                    agreedToTerms={reg.agreedToTerms}
                    setAgreedToTerms={reg.setAgreedToTerms}
                    focusedField={reg.focusedField}
                    setFocusedField={reg.setFocusedField}
                    fadeAnims={fadeAnims}
                    translateYAnims={translateYAnims}
                  />

                  {/* Register Button */}
                  <Animated.View
                    style={{
                      opacity: fadeAnims[6],
                      transform: [{ translateY: translateYAnims[6] }, { scale: buttonScale }],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={reg.handleRegister}
                      disabled={reg.isLoading}
                    >
                      <LinearGradient
                        colors={['rgba(16, 185, 129, 0.18)', 'rgba(139, 92, 246, 0.18)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.ctaButton, reg.isLoading && styles.buttonDisabled]}
                      >
                        {reg.isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.loadingText}>Creating account...</Text>
                          </View>
                        ) : (
                          <Text style={styles.buttonText}>Create Account →</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* OAuth */}
                  <Animated.View
                    style={{
                      opacity: fadeAnims[7],
                      transform: [{ translateY: translateYAnims[7] }],
                    }}
                  >
                    <AuthDivider text="Or continue with" />
                    <OAuthButtonGroup
                      variant="icon"
                      providers={['google', 'apple', 'facebook', 'tiktok']}
                      onSuccess={() => {}}
                      onError={(error) => {
                        if (!error.message.includes('cancelled'))
                          console.error('OAuth error:', error);
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
