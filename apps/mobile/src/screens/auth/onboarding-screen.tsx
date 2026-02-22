/**
 * Onboarding Screen - Mobile
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

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/theme-context';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';
import { MatrixAuthBackground } from '../../components/matrix';
import api from '../../lib/api';

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

interface NotificationSettings {
  messages: boolean;
  mentions: boolean;
  friendRequests: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  { id: 1, title: 'Welcome', icon: '👋' },
  { id: 2, title: 'Profile', icon: '👤' },
  { id: 3, title: 'Notifications', icon: '🔔' },
  { id: 4, title: 'Ready', icon: '🚀' },
];

const FEATURES = [
  { icon: '💬', title: 'Encrypted Chat', desc: 'End-to-end encryption' },
  { icon: '👥', title: 'Groups', desc: 'Create communities' },
  { icon: '📋', title: 'Forums', desc: 'Forum-style discussions' },
  { icon: '🏆', title: 'Gamification', desc: 'Earn XP & achievements' },
  { icon: '📞', title: 'Calls', desc: 'Voice & video calling' },
  { icon: '🎨', title: 'Themes', desc: 'Customize your look' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();

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
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: targetSlide * 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
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
        // Upload avatar if changed
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

        // Update profile via API
        await api.patch('/api/v1/users/profile', {
          display_name: displayName,
          bio,
        });

        // Update notification settings
        await api.patch('/api/v1/users/settings/notifications', notifications);

        // Mark onboarding complete
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
              {FEATURES.slice(0, 3).map((feature, index) => (
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

      case 4:
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

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 32,
  },

  // Welcome step
  welcomeIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeIcon: {
    fontSize: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  welcomeFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Profile step
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 18,
  },
  avatarHint: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
  },

  // Notifications step
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  notificationList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 14,
  },

  // Ready step
  readyIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  readyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyIcon: {
    fontSize: 48,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  readySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureGridCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureGridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureGridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureGridDesc: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    fontSize: 16,
  },
  nextButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
