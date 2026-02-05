/**
 * QuestSection - Collapsible section for quest type grouping
 */

import React, { useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

import { QuestSectionProps } from '../types';
import { QUEST_TYPE_CONFIG } from '../constants';
import { styles } from '../styles';
import { QuestCard } from './QuestCard';

export function QuestSection({ type, quests, onClaim, initialExpanded = true }: QuestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const heightAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;

  const config = QUEST_TYPE_CONFIG[type];
  const completedCount = quests.filter((q) => q.status === 'claimed').length;

  const toggleExpanded = () => {
    HapticFeedback.light();
    const toValue = isExpanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue,
        tension: 100,
        friction: 15,
        useNativeDriver: false,
      }),
      Animated.spring(rotateAnim, {
        toValue,
        tension: 100,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const containerHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, quests.length * 200], // Approximate height per quest
  });

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
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.sectionContent, { maxHeight: containerHeight }]}>
        {isExpanded &&
          quests.map((quest) => <QuestCard key={quest.id} quest={quest} onClaim={onClaim} />)}
      </Animated.View>
    </View>
  );
}
