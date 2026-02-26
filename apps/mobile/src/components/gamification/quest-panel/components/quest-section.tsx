/**
 * QuestSection - Collapsible section for quest type grouping
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import { QuestSectionProps } from '../types';
import { QUEST_TYPE_CONFIG } from '../constants';
import { styles } from '../styles';
import { QuestCard } from './quest-card';

/**
 *
 */
export function QuestSection({ type, quests, onClaim, initialExpanded = true }: QuestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const heightAnim = useSharedValue(initialExpanded ? 1 : 0);
  const rotateAnim = useSharedValue(initialExpanded ? 1 : 0);

  const config = QUEST_TYPE_CONFIG[type];
  const completedCount = quests.filter((q) => q.status === 'claimed').length;

  const toggleExpanded = () => {
    HapticFeedback.light();
    const toValue = isExpanded ? 0 : 1;

    heightAnim.value = withSpring(toValue, { stiffness: 100, damping: 15 });
    rotateAnim.value = withSpring(toValue, { stiffness: 100, damping: 15 });

    setIsExpanded(!isExpanded);
  };

  const rotateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotateAnim.value, [0, 1], [0, 180])}deg` }],
  }));

  const containerHeightStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(heightAnim.value, [0, 1], [0, quests.length * 200]),
  }));

  return (
    <View style={styles.questSection}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
        <View style={[styles.sectionHeader, { backgroundColor: config.bgColor }]}>
          <View style={styles.sectionHeaderLeft}>
            <LinearGradient
              colors={config.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIcon}
            >
              <Ionicons
                 
                name={config.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color="#fff"
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>{config.label} Quests</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>
                {completedCount}/{quests.length}
              </Text>
            </View>
          </View>
          <Animated.View style={rotateAnimatedStyle}>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.sectionContent, containerHeightStyle]}>
        {isExpanded &&
          quests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaim} />)}
      </Animated.View>
    </View>
  );
}
