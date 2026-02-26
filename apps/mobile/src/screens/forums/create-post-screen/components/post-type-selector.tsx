/**
 * PostTypeSelector - Animated post type selection with morphing indicator
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, withSequence, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../../../components/ui/glass-card';

import { PostTypeSelectorProps, PostType } from '../types';
import { styles } from '../styles';
import { POST_TYPES, SCREEN_WIDTH } from '../constants';

/**
 *
 */
export function PostTypeSelector({ selectedType, onTypeChange }: PostTypeSelectorProps) {
  // POST_TYPES is a constant array, so hook count is stable
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const scaleAnims = POST_TYPES.map(() => useSharedValue(1));
  const scaleAnimStyles = POST_TYPES.map((_, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnims[i].value }],
    }))
  );
  const indicatorAnim = useSharedValue(0);

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(
      indicatorAnim.value,
      POST_TYPES.map((_, i) => i),
      POST_TYPES.map((_, i) => i * ((SCREEN_WIDTH - 32 - 24) / POST_TYPES.length))
    ) }],
  }));

  useEffect(() => {
    const selectedIndex = POST_TYPES.findIndex((t) => t.type === selectedType);
    indicatorAnim.value = withSpring(selectedIndex, { damping: 8, stiffness: 100 });
  }, [selectedType]);

  const handlePress = (type: PostType, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bounce animation
    scaleAnims[index].value = withSequence(
      withTiming(0.9, { duration: durations.instant.ms }),
      withSpring(1, { damping: 4, stiffness: 100 })
    );

    onTypeChange(type);
  };

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
              },
              indicatorAnimStyle,
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
              style={[styles.postTypeOption, scaleAnimStyles[index]]}
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
