/**
 * QuestPreviewCard - Quest preview with progress bar
 *
 * Features:
 * - Progress percentage display
 * - Animated progress bar fill
 * - Gradient card styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface QuestPreviewCardProps {
  quest: {
    id: string;
    quest: {
      name: string;
      description: string;
      objectives: Array<{ targetValue: number }>;
    };
    progress: Record<string, number>;
  };
}

/**
 *
 */
export function QuestPreviewCard({ quest }: QuestPreviewCardProps) {
  const progress = Object.values(quest.progress).reduce((a, b) => a + b, 0);
  const target = quest.quest.objectives.reduce((a, o) => a + o.targetValue, 0);
  const progressPercent = target > 0 ? Math.round((progress / target) * 100) : 0;

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#10b98120', '#1f2937']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="map" size={20} color="#10b981" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{quest.quest.name}</Text>
            <Text style={styles.description} numberOfLines={1}>
              {quest.quest.description}
            </Text>
          </View>
          <Text style={styles.progress}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
});

export default QuestPreviewCard;
