/**
 * PostTypeSelector - Animated post type selection with morphing indicator
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../../../../components/ui/glass-card';

import { PostTypeSelectorProps, PostType } from '../types';
import { styles } from '../styles';
import { POST_TYPES, SCREEN_WIDTH } from '../constants';

export function PostTypeSelector({ selectedType, onTypeChange }: PostTypeSelectorProps) {
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
