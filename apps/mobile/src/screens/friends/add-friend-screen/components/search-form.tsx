/**
 * Search form card with animated input, error/success states, and send button.
 * @module screens/friends/add-friend-screen/components/search-form
 */
import { durations } from '@cgraph/animation-constants';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../lib/api';
import GlassCard from '../../../../components/ui/glass-card';
import { styles } from '../styles';

interface SearchFormProps {
  onSuccess: () => void;
}

/** Description. */
/** Search Form component. */
export function SearchForm({ onSuccess }: SearchFormProps) {
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
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: durations.dramatic.ms,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(inputGlow, {
      toValue: isFocused ? 1 : 0,
      duration: durations.slow.ms,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
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
          duration: durations.slow.ms,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      successScale.setValue(0);
      successOpacity.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(errorShake, {
          toValue: 10,
          duration: durations.stagger.ms,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: -10,
          duration: durations.stagger.ms,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: 10,
          duration: durations.stagger.ms,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: 0,
          duration: durations.stagger.ms,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      const cleaned = input.replace('#', '');
      const isUid = /^\d{1,10}$/.test(cleaned);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

      let payload: { user_id?: string; username?: string; email?: string; uid?: string };
      if (isUuid) payload = { user_id: input };
      else if (isEmail) payload = { email: input };
      else if (isUid) payload = { uid: cleaned };
      else payload = { username: input };

      await api.post('/api/v1/friends', payload);
      setSuccess(true);
      setSearchInput('');
      onSuccess();
    } catch (err: unknown) {
       
      const apiErr = err as { response?: { data?: { error?: { message?: string } | string } } };
      let errorMessage =
        typeof apiErr.response?.data?.error === 'object'
          ? apiErr.response?.data?.error?.message
          : apiErr.response?.data?.error;
      if (errorMessage?.includes('Idempotency-Key') || errorMessage?.includes('idempotency')) {
        errorMessage = 'Please wait a moment before trying again';
      }
      setError(errorMessage || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const glowColor = inputGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139, 92, 246, 0)', 'rgba(139, 92, 246, 0.3)'],
  });

  return (
    <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}>
      <GlassCard variant="neon" intensity="medium" style={styles.mainCard}>
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
          <Animated.View style={[styles.inputGlow, { backgroundColor: glowColor }]} />
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

        {error ? (
          <Animated.View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {success && (
          <Animated.View
            style={[
              styles.successContainer,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
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

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleSendRequest}
            activeOpacity={0.9}
            disabled={loading || !searchInput.trim()}
          >
            <LinearGradient
              colors={!searchInput.trim() ? ['#374151', '#1F2937'] : ['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, !searchInput.trim() && styles.buttonDisabled]}
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
  );
}
