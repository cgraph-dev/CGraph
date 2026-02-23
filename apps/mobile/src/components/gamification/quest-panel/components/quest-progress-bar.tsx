/**
 * QuestProgressBar - Animated progress indicator for quests
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { QuestProgressBarProps } from '../types';
import { styles } from '../styles';

export function QuestProgressBar({ current, target, colors }: QuestProgressBarProps) {
  const progressAnim = useSharedValue(0);
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  useEffect(() => {
    progressAnim.value = withSpring(percent, { stiffness: 50, damping: 10 });
  }, [percent, progressAnim]);

  const progressWidthStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  return (
    <View style={styles.questProgressContainer}>
      <View style={styles.questProgressBar}>
        <Animated.View style={[styles.questProgressFill, progressWidthStyle]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.questProgressGradient}
          />
        </Animated.View>
      </View>
      <Text style={styles.questProgressText}>
        {current} / {target}
      </Text>
    </View>
  );
}
