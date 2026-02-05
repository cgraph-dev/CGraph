/**
 * Podium - Top 3 display with medals
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LeaderboardEntry, CategoryConfig } from '../types';
import { RANK_CONFIGS, formatValue } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PodiumProps {
  entries: LeaderboardEntry[];
  category: CategoryConfig;
  onUserPress: (userId: string) => void;
}

export function Podium({ entries, category, onUserPress }: PodiumProps) {
  const top3 = entries.slice(0, 3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = [100, 140, 80]; // Heights for 2nd, 1st, 3rd

  return (
    <View style={styles.podiumContainer}>
      {podiumOrder.map((entry, index) => {
        if (!entry) return null;
        const config = RANK_CONFIGS[entry.rank];
        const height = heights[index];

        return (
          <TouchableOpacity
            key={entry.userId}
            style={[styles.podiumPlace, { height: height + 80 }]}
            onPress={() => onUserPress(entry.userId)}
            activeOpacity={0.8}
          >
            <View style={styles.podiumAvatar}>
              {entry.avatarUrl ? (
                <Image source={{ uri: entry.avatarUrl }} style={styles.podiumAvatarImage} />
              ) : (
                <LinearGradient colors={category.colors} style={styles.podiumAvatarPlaceholder}>
                  <Text style={styles.podiumAvatarInitial}>
                    {entry.displayName?.[0] || entry.username[0]}
                  </Text>
                </LinearGradient>
              )}
              {config && (
                <View style={styles.podiumMedal}>
                  <Text style={styles.podiumMedalText}>{config.medal}</Text>
                </View>
              )}
            </View>

            <Text style={styles.podiumUsername} numberOfLines={1}>
              {entry.displayName || entry.username}
            </Text>

            <Text style={styles.podiumValue}>{formatValue(entry.value)}</Text>

            <LinearGradient
              colors={config?.colors || category.colors}
              style={[styles.podiumBar, { height }]}
            >
              <Text style={styles.podiumRank}>#{entry.rank}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  podiumPlace: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 3,
  },
  podiumAvatar: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  podiumAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  podiumMedal: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  podiumMedalText: {
    fontSize: 20,
  },
  podiumUsername: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default Podium;
