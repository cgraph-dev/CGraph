/**
 * AddFriendScreen - Premium Mobile UI
 * 
 * Enhanced friend-adding experience with:
 * - Animated glassmorphism cards
 * - Gradient accents and glow effects
 * - Haptic feedback
 * - Success/error animations
 * - Interactive info cards
 * - Floating particle background
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import GlassCard from '../../components/ui/GlassCard';
import { Header } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Floating Particle Component
function FloatingParticle({ delay, size, startX }: { delay: number; size: number; startX: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      translateY.setValue(600);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 8000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 5000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          left: startX,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

// Info Step Component
function InfoStep({ number, title, description, delay }: { 
  number: number; 
  title: string; 
  description: string;
  delay: number;
}) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.infoStep,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepNumber}
      >
        <Text style={styles.stepNumberText}>{number}</Text>
      </LinearGradient>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

export default function AddFriendScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const inputGlow = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Input focus glow animation
    Animated.timing(inputGlow, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    // Success animation
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      successScale.setValue(0);
      successOpacity.setValue(0);
    }
  }, [success]);

  useEffect(() => {
    // Error shake animation
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonScale, {
      toValue: 0.96,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleSendRequest = async () => {
    const input = searchInput.trim();
    if (!input) {
      setError('Please enter a username, email, or user ID');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Determine the type of identifier
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      const cleaned = input.replace('#', '');
      const isUid = /^\d{1,10}$/.test(cleaned);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      
      let payload: { user_id?: string; username?: string; email?: string; uid?: string };
      if (isUuid) {
        payload = { user_id: input };
      } else if (isEmail) {
        payload = { email: input };
      } else if (isUid) {
        payload = { uid: cleaned };
      } else {
        payload = { username: input };
      }
      
      await api.post('/api/v1/friends', payload);
      setSuccess(true);
      setSearchInput('');
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } | string } } };
      const errorMessage = typeof error.response?.data?.error === 'object' 
        ? error.response?.data?.error?.message 
        : error.response?.data?.error;
      setError(errorMessage || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const glowColor = inputGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0)', 'rgba(139, 92, 246, 0.3)'],
  });

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 800,
    size: 4 + Math.random() * 4,
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Particles Background */}
      <View style={styles.particleContainer}>
        {particles.map((p) => (
          <FloatingParticle key={p.id} delay={p.delay} size={p.size} startX={p.startX} />
        ))}
      </View>

      <Header
        title="Add Friend"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Card */}
          <Animated.View
            style={[
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <GlassCard variant="neon" intensity="medium" style={styles.mainCard}>
              {/* Header Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="person-add" size={32} color="#FFF" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Add a Friend</Text>
              <Text style={styles.description}>
                Enter your friend's username, email, or user ID to connect with them
              </Text>

              {/* Animated Input */}
              <Animated.View
                style={[
                  styles.inputWrapper,
                  {
                    shadowColor: '#8B5CF6',
                    shadowOpacity: inputGlow,
                    shadowRadius: 12,
                    transform: [{ translateX: errorShake }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.inputGlow,
                    { backgroundColor: glowColor },
                  ]}
                />
                <View style={styles.inputContainer}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    color={isFocused ? '#8B5CF6' : '#6B7280'} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username, email, or #ID"
                    placeholderTextColor="#6B7280"
                    value={searchInput}
                    onChangeText={(text) => {
                      setSearchInput(text);
                      setError('');
                      setSuccess(false);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchInput.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSearchInput('');
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>

              {/* Error Message */}
              {error ? (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* Success Message */}
              {success && (
                <Animated.View
                  style={[
                    styles.successContainer,
                    {
                      opacity: successOpacity,
                      transform: [{ scale: successScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(34, 197, 94, 0.2)', 'rgba(16, 185, 129, 0.2)']}
                    style={styles.successGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                    <Text style={styles.successText}>Friend request sent successfully!</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Send Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleSendRequest}
                  activeOpacity={0.9}
                  disabled={loading || !searchInput.trim()}
                >
                  <LinearGradient
                    colors={
                      !searchInput.trim()
                        ? ['#374151', '#1F2937']
                        : ['#8B5CF6', '#6366F1']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.button,
                      !searchInput.trim() && styles.buttonDisabled,
                    ]}
                  >
                    {loading ? (
                      <Animated.View style={styles.loadingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                      </Animated.View>
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Send Friend Request</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </GlassCard>
          </Animated.View>

          {/* Info Card */}
          <GlassCard variant="frosted" intensity="subtle" style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#60A5FA" />
              <Text style={styles.infoTitle}>How to find friends</Text>
            </View>

            <InfoStep
              number={1}
              title="By Username"
              description="Enter their @username (e.g., john_doe)"
              delay={200}
            />
            <InfoStep
              number={2}
              title="By User ID"
              description="Enter their 10-digit ID (e.g., #4829173650)"
              delay={350}
            />
            <InfoStep
              number={3}
              title="By Email"
              description="Enter their email address"
              delay={500}
            />
          </GlassCard>

          {/* Quick Tips */}
          <GlassCard variant="frosted" intensity="subtle" style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color="#FBBF24" />
              <Text style={styles.tipText}>
                Tip: You can find your own ID in Settings → Profile to share with friends!
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#8B5CF6',
    borderRadius: 100,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    padding: 24,
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputWrapper: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F3F4F6',
    height: 56,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  successGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  successText: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F3F4F6',
    marginLeft: 10,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  tipsCard: {
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 12,
    lineHeight: 20,
  },
});
