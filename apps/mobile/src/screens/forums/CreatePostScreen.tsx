/**
 * CreatePostScreen - Revolutionary Mobile Edition
 *
 * Premium post creation experience with advanced animations.
 *
 * Features:
 * - Animated input fields with focus effects
 * - Character counter with progress animation
 * - Post type selector with morphing animations
 * - Animated submit button with loading states
 * - Media attachment preview with spring animations
 * - Tag suggestions with staggered entry
 * - Real-time preview with glassmorphism
 * - Haptic feedback throughout
 *
 * @version 2.0.0 - Revolutionary Edition
 * @since v0.9.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList } from '../../types';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_TITLE_LENGTH = 300;

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'CreatePost'>;
  route: RouteProp<ForumsStackParamList, 'CreatePost'>;
};

type PostType = 'text' | 'link' | 'image' | 'poll';

interface PostTypeOption {
  type: PostType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

const POST_TYPES: PostTypeOption[] = [
  { type: 'text', icon: 'document-text', label: 'Text', color: '#8B5CF6' },
  { type: 'link', icon: 'link', label: 'Link', color: '#3B82F6' },
  { type: 'image', icon: 'image', label: 'Image', color: '#10B981' },
  { type: 'poll', icon: 'stats-chart', label: 'Poll', color: '#F59E0B' },
];

// =============================================================================
// ANIMATED INPUT FIELD
// =============================================================================

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  minHeight?: number;
  showCharCount?: boolean;
}

function AnimatedInputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  minHeight,
  showCharCount = false,
}: AnimatedInputProps) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.1)', '#8B5CF6'],
  });

  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const charProgress = maxLength ? (value.length / maxLength) * 100 : 0;
  const isNearLimit = maxLength && value.length > maxLength * 0.9;

  return (
    <Animated.View style={styles.inputContainer}>
      {/* Label */}
      <Animated.View
        style={[
          styles.labelContainer,
          {
            transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
          },
        ]}
      >
        <Text style={styles.inputLabel}>{label}</Text>
      </Animated.View>

      {/* Input wrapper with glow */}
      <View style={styles.inputWrapper}>
        <Animated.View
          style={[
            styles.inputGlow,
            {
              opacity: glowAnim,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.inputBorder,
            {
              borderColor,
              transform: [
                {
                  translateX: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-4, 4],
                  }),
                },
              ],
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              multiline && { minHeight: minHeight || 150, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            maxLength={maxLength}
          />
        </Animated.View>
      </View>

      {/* Character count */}
      {showCharCount && maxLength && (
        <View style={styles.charCountContainer}>
          <View style={styles.charProgressBar}>
            <Animated.View
              style={[
                styles.charProgressFill,
                {
                  width: `${Math.min(charProgress, 100)}%`,
                  backgroundColor: isNearLimit ? '#EF4444' : '#8B5CF6',
                },
              ]}
            />
          </View>
          <Text style={[styles.charCountText, isNearLimit ? { color: '#EF4444' } : undefined]}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// =============================================================================
// POST TYPE SELECTOR
// =============================================================================

interface PostTypeSelectorProps {
  selectedType: PostType;
  onTypeChange: (type: PostType) => void;
}

function PostTypeSelector({ selectedType, onTypeChange }: PostTypeSelectorProps) {
  const scaleAnims = useRef(POST_TYPES.map(() => new Animated.Value(1))).current;

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const selectedIndex = POST_TYPES.findIndex((t) => t.type === selectedType);
    Animated.spring(indicatorAnim, {
      toValue: selectedIndex,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [selectedType]);

  const handlePress = (type: PostType, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onTypeChange(type);
  };

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: POST_TYPES.map((_, i) => i),
    outputRange: POST_TYPES.map((_, i) => i * ((SCREEN_WIDTH - 32 - 24) / POST_TYPES.length)),
  });

  return (
    <View style={styles.postTypeContainer}>
      <Text style={styles.sectionLabel}>Post Type</Text>
      <GlassCard variant="frosted" intensity="subtle" style={styles.postTypeCard}>
        <View style={styles.postTypeRow}>
          {/* Animated indicator */}
          <Animated.View
            style={[
              styles.postTypeIndicator,
              {
                width: (SCREEN_WIDTH - 32 - 24) / POST_TYPES.length,
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.postTypeIndicatorGradient}
            />
          </Animated.View>

          {POST_TYPES.map((option, index) => (
            <Animated.View
              key={option.type}
              style={[styles.postTypeOption, { transform: [{ scale: scaleAnims[index] }] }]}
            >
              <TouchableOpacity
                style={styles.postTypeButton}
                onPress={() => handlePress(option.type, index)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={selectedType === option.type ? '#FFF' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.postTypeLabel,
                    selectedType === option.type && styles.postTypeLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

// =============================================================================
// ANIMATED SUBMIT BUTTON
// =============================================================================

interface SubmitButtonProps {
  onPress: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

function AnimatedSubmitButton({ onPress, isDisabled, isLoading }: SubmitButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDisabled && !isLoading) {
      // Subtle pulse when enabled
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isDisabled, isLoading]);

  const handlePressIn = () => {
    if (isDisabled || isLoading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isDisabled || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, SCREEN_WIDTH],
  });

  return (
    <Animated.View style={[styles.submitButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Glow effect */}
      {!isDisabled && <Animated.View style={[styles.submitButtonGlow, { opacity: glowAnim }]} />}

      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled || isLoading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={isDisabled ? ['#374151', '#1F2937'] : ['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitButton}
        >
          {/* Shimmer overlay */}
          {!isDisabled && !isLoading && (
            <Animated.View
              style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color={isDisabled ? '#6B7280' : '#FFF'} />
              <Text style={[styles.submitButtonText, isDisabled && { color: '#6B7280' }]}>
                Create Post
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// =============================================================================
// CANCEL BUTTON
// =============================================================================

function CancelButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Ionicons name="close" size={20} color="#9CA3AF" />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CreatePostScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#111827',
      },
      headerTitleStyle: {
        color: '#FFF',
        fontWeight: '700',
      },
      headerTintColor: '#FFF',
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post(`/api/v1/forums/${forumId}/posts`, {
        title: title.trim(),
        content: content.trim(),
        type: postType,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient colors={['#111827', '#0F172A', '#111827']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.ScrollView
          style={[
            styles.scrollView,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Post Type Selector */}
          <PostTypeSelector selectedType={postType} onTypeChange={setPostType} />

          {/* Title Input */}
          <AnimatedInputField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="An interesting title for your post..."
            maxLength={MAX_TITLE_LENGTH}
            showCharCount
          />

          {/* Content Input */}
          <AnimatedInputField
            label="Content (Optional)"
            value={content}
            onChangeText={setContent}
            placeholder="Write something interesting..."
            multiline
            minHeight={200}
          />

          {/* Preview hint */}
          {title.trim() && (
            <Animated.View style={styles.previewHint}>
              <GlassCard variant="frosted" intensity="subtle" style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.previewLabel}>Preview</Text>
                </View>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {title.trim()}
                </Text>
                {content.trim() && (
                  <Text style={styles.previewContent} numberOfLines={3}>
                    {content.trim()}
                  </Text>
                )}
                <View style={styles.previewMeta}>
                  <View style={styles.previewBadge}>
                    <Ionicons
                      name={POST_TYPES.find((t) => t.type === postType)?.icon || 'document-text'}
                      size={12}
                      color="#8B5CF6"
                    />
                    <Text style={styles.previewBadgeText}>{postType}</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Spacer for footer */}
          <View style={{ height: 120 }} />
        </Animated.ScrollView>

        {/* Footer */}
        <BlurView intensity={60} tint="dark" style={styles.footer}>
          <View style={styles.footerContent}>
            <CancelButton onPress={() => navigation.goBack()} />
            <View style={{ width: 12 }} />
            <View style={{ flex: 2 }}>
              <AnimatedSubmitButton
                onPress={handleSubmit}
                isDisabled={!canSubmit}
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // Section label
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  // Post type selector
  postTypeContainer: {
    marginBottom: 24,
  },
  postTypeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  postTypeRow: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  postTypeIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  postTypeIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },
  postTypeOption: {
    flex: 1,
    zIndex: 1,
  },
  postTypeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  postTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  postTypeLabelActive: {
    color: '#FFF',
  },
  // Input field
  inputContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputBorder: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    minHeight: 56,
  },
  // Character count
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  charProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  charProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  charCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Preview
  previewHint: {
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'capitalize',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerContent: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  // Cancel button
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Submit button
  submitButtonWrapper: {
    position: 'relative',
  },
  submitButtonGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    overflow: 'hidden',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
});
