/**
 * Onboarding Screen - Main Component
 *
 * First-time user experience with:
 * - Welcome screens with animations
 * - Avatar upload
 * - Display name & bio setup
 * - Notification preferences
 * - Feature highlights
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useThemeStore } from '@/stores';
import { MatrixAuthBackground } from '../../../components/matrix';
import api from '../../../lib/api';
import type { FEATURES, NotificationSettings, OnboardingProps, SCREEN_WIDTH, STEPS } from './types';
import { styles } from './styles';

/**
 *
 */
export default function OnboardingScreen({ navigation }: OnboardingProps) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Profile data
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url ?? null);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [bio, setBio] = useState('');
  const [notifications, setNotifications] = useState<NotificationSettings>({
    messages: true,
    mentions: true,
    friendRequests: true,
  });

  // Find friends state
  const [friendQuery, setFriendQuery] = useState('');
  const [friendResults, setFriendResults] = useState<Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>>([]);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [sentFriendRequests, setSentFriendRequests] = useState<Set<string>>(new Set());
  const friendSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Update progress bar animation
  React.useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep - 1) / (STEPS.length - 1),
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [currentStep, progressAnim]);

  // Handle avatar selection
  const pickAvatar = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to set an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Animate step transition
  const animateTransition = useCallback(
    (direction: 'next' | 'back') => {
      const targetSlide = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: durations.fast.ms,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: targetSlide * 0.3,
          duration: durations.fast.ms,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 10,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  // Handle navigation
  const handleNext = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < STEPS.length) {
      animateTransition('next');
      setTimeout(() => setCurrentStep((prev) => prev + 1), 150);
    } else {
      // Complete onboarding
      setIsLoading(true);
      try {
        if (avatarUri && avatarUri !== user?.avatar_url) {
          const formData = new FormData();
           
          formData.append('avatar', {
            uri: avatarUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as unknown as Blob);
          await api.post('/api/v1/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }

        await api.patch('/api/v1/users/profile', {
          display_name: displayName,
          bio,
        });

        await api.patch('/api/v1/users/settings/notifications', notifications);
        await api.post('/api/v1/users/onboarding/complete');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } catch (error) {
        Alert.alert('Error', 'Failed to save settings. Please try again.');
        console.error('Onboarding error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [
    currentStep,
    avatarUri,
    displayName,
    bio,
    notifications,
    user,
    navigation,
    animateTransition,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition('back');
      setTimeout(() => setCurrentStep((prev) => prev - 1), 150);
    }
  }, [currentStep, animateTransition]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.welcomeIconContainer}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.welcomeIconGradient}
              >
                <Text style={styles.welcomeIcon}>👋</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to CGraph</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Let&apos;s set up your profile in a few quick steps
            </Text>
            <View style={styles.welcomeFeatures}>
              {FEATURES.slice(0, 3).map((feature) => (
                <View
                  key={feature.title}
                  style={[styles.featureCard, { backgroundColor: colors.surface }]}
                >
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitial}>
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
              <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarEditIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
              Tap to upload a photo
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Bio (optional)
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={200}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {bio.length}/200
              </Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Find Friends</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Search for people you know
            </Text>

            <View style={[styles.inputGroup, { marginBottom: 16 }]}>
              <TextInput
                value={friendQuery}
                onChangeText={(text) => {
                  setFriendQuery(text);
                  if (friendSearchTimer.current) clearTimeout(friendSearchTimer.current);
                  if (text.length >= 2) {
                    setFriendSearchLoading(true);
                    friendSearchTimer.current = setTimeout(async () => {
                      try {
                        const res = await api.get('/api/v1/search/users', { params: { q: text } });
                        setFriendResults(res.data?.data ?? []);
                      } catch {
                        setFriendResults([]);
                      } finally {
                        setFriendSearchLoading(false);
                      }
                    }, 300);
                  } else {
                    setFriendResults([]);
                    setFriendSearchLoading(false);
                  }
                }}
                placeholder="Search by username or name…"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            {friendSearchLoading && (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            )}

            <FlatList
              data={friendResults}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 240 }}
              renderItem={({ item }) => {
                const isSent = sentFriendRequests.has(item.id);
                return (
                  <View
                    style={[
                      styles.notificationItem,
                      { backgroundColor: colors.surface, marginBottom: 8 },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {item.avatar_url ? (
                        <Image
                          source={{ uri: item.avatar_url }}
                          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            marginRight: 10,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {(item.display_name ?? item.username).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.notificationTitle, { color: colors.text }]}>
                          {item.display_name ?? item.username}
                        </Text>
                        <Text style={[styles.notificationDesc, { color: colors.textSecondary }]}>
                          @{item.username}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      disabled={isSent}
                      onPress={async () => {
                        try {
                          await api.post('/api/v1/friends', { friend_id: item.id });
                          setSentFriendRequests((prev) => new Set(prev).add(item.id));
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {
                          // ignore
                        }
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isSent ? colors.border : colors.primary,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                        {isSent ? 'Sent' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                !friendSearchLoading && friendQuery.length >= 2 ? (
                  <Text
                    style={{
                      textAlign: 'center',
                      color: colors.textSecondary,
                      marginTop: 16,
                    }}
                  >
                    No users found
                  </Text>
                ) : null
              }
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Stay Connected</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Choose how you want to be notified
            </Text>

            <View style={styles.notificationList}>
              {[
                {
                  key: 'messages' as const,
                  title: 'Direct Messages',
                  desc: 'New messages from friends',
                },
                { key: 'mentions' as const, title: 'Mentions', desc: 'When someone @mentions you' },
                {
                  key: 'friendRequests' as const,
                  title: 'Friend Requests',
                  desc: 'New friend requests',
                },
              ].map(({ key, title, desc }) => (
                <View
                  key={key}
                  style={[styles.notificationItem, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.notificationDesc, { color: colors.textSecondary }]}>
                      {desc}
                    </Text>
                  </View>
                  <Switch
                    value={notifications[key]}
                    onValueChange={(value) => {
                      setNotifications((prev) => ({ ...prev, [key]: value }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={
                      Platform.OS === 'ios'
                        ? '#fff'
                        : notifications[key]
                          ? colors.primary
                          : '#f4f3f4'
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <View style={styles.readyIconContainer}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.readyIconGradient}
              >
                <Text style={styles.readyIcon}>🚀</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.readyTitle, { color: colors.text }]}>You&apos;re All Set!</Text>
            <Text style={[styles.readySubtitle, { color: colors.textSecondary }]}>
              Explore everything CGraph has to offer
            </Text>

            <View style={styles.featuresGrid}>
              {FEATURES.map((feature) => (
                <View
                  key={feature.title}
                  style={[styles.featureGridCard, { backgroundColor: colors.surface }]}
                >
                  <Text style={styles.featureGridIcon}>{feature.icon}</Text>
                  <Text style={[styles.featureGridTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureGridDesc, { color: colors.textSecondary }]}>
                    {feature.desc}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MatrixAuthBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.stepsIndicator}>
            {STEPS.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: step.id <= currentStep ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.animatedContent,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep === 1 ? (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={isLoading}
            style={styles.nextButtonContainer}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextText}>
                  {currentStep === STEPS.length ? 'Get Started' : 'Continue'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
