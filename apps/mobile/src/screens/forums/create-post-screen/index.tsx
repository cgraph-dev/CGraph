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

import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../../lib/api';
import { ForumsStackParamList } from '../../../types';

import { PostType } from './types';
import { styles } from './styles';
import { MAX_TITLE_LENGTH } from './constants';
import {
  AnimatedInputField,
  PostTypeSelector,
  AnimatedSubmitButton,
  CancelButton,
  PostPreview,
} from './components';

// Re-export types
export type { PostType, PostTypeOption } from './types';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'CreatePost'>;
  route: RouteProp<ForumsStackParamList, 'CreatePost'>;
};

/**
 *
 */
export default function CreatePostScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { _colors } = useThemeStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);

  // Entry animation
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

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

    fadeAnim.value = withTiming(1, { duration: durations.smooth.ms });
    slideAnim.value = withSpring(0, { damping: 8, stiffness: 50 });
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
      const payload: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        type: postType,
      };

      if (showPoll && pollQuestion.trim()) {
        const validOptions = pollOptions.filter((o) => o.trim());
        if (validOptions.length < 2) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', 'Polls need at least 2 options');
          setIsSubmitting(false);
          return;
        }
        payload.poll = {
          question: pollQuestion.trim(),
          options: validOptions.map((o) => o.trim()),
          multiple_choice: pollMultipleChoice,
        };
      }

      await api.post(`/api/v1/forums/${forumId}/posts`, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
       
      const apiError = error as { response?: { data?: { message?: string } } };
      Alert.alert('Error', apiError.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0;

  const scrollAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

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
            scrollAnimStyle,
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

          {/* Preview */}
          <PostPreview title={title} content={content} postType={postType} />

          {/* Poll Toggle & Fields */}
          <View style={pollStyles.pollSection}>
            <View style={pollStyles.pollToggleRow}>
              <Text style={pollStyles.pollLabel}>Attach Poll</Text>
              <Switch
                value={showPoll}
                onValueChange={(v) => {
                  setShowPoll(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#374151', true: '#8B5CF6' }}
              />
            </View>

            {showPoll && (
              <View style={pollStyles.pollFields}>
                <TextInput
                  style={pollStyles.pollInput}
                  placeholder="Poll question..."
                  placeholderTextColor="#6B7280"
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                />

                {pollOptions.map((opt, idx) => (
                  <View key={idx} style={pollStyles.optionRow}>
                    <TextInput
                      style={[pollStyles.pollInput, { flex: 1 }]}
                      placeholder={`Option ${idx + 1}`}
                      placeholderTextColor="#6B7280"
                      value={opt}
                      onChangeText={(text) => {
                        const next = [...pollOptions];
                        next[idx] = text;
                        setPollOptions(next);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity
                        onPress={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        style={pollStyles.removeBtn}
                      >
                        <Text style={pollStyles.removeBtnText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {pollOptions.length < 10 && (
                  <TouchableOpacity
                    onPress={() => setPollOptions([...pollOptions, ''])}
                    style={pollStyles.addOptionBtn}
                  >
                    <Text style={pollStyles.addOptionText}>+ Add option</Text>
                  </TouchableOpacity>
                )}

                <View style={pollStyles.pollToggleRow}>
                  <Text style={pollStyles.pollSubLabel}>Allow multiple choices</Text>
                  <Switch
                    value={pollMultipleChoice}
                    onValueChange={setPollMultipleChoice}
                    trackColor={{ false: '#374151', true: '#8B5CF6' }}
                  />
                </View>
              </View>
            )}
          </View>

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

// ---------------------------------------------------------------------------
// Poll-specific styles
// ---------------------------------------------------------------------------

const pollStyles = StyleSheet.create({
  pollSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  pollToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollLabel: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '600',
  },
  pollSubLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  pollFields: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  pollInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F9FAFB',
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '700',
  },
  addOptionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  addOptionText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
  },
});
