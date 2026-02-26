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

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
  const { colors } = useThemeStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    fadeAnim.value = withTiming(1, { duration: 400 });
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
      await api.post(`/api/v1/forums/${forumId}/posts`, {
        title: title.trim(),
        content: content.trim(),
        type: postType,
      });

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
