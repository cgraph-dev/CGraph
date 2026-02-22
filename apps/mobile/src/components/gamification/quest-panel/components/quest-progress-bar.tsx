/**
 * QuestProgressBar - Animated progress indicator for quests
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { QuestProgressBarProps } from '../types';
import { styles } from '../styles';

export function QuestProgressBar({ current, target, colors }: QuestProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percent,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [percent, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.questProgressContainer}>
      <View style={styles.questProgressBar}>
        <Animated.View style={[styles.questProgressFill, { width: progressWidth }]}>
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
