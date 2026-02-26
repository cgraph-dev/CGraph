import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedAvatar from '../../../components/ui/animated-avatar';
import { getValidImageUrl } from '../../../lib/imageUtils';
import { LeaderboardUser, formatKarma } from './leaderboard-types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PodiumSectionProps {
  users: LeaderboardUser[];
  podiumAnims: Animated.Value[];
  categoryColor: string;
  colors: { text: string; [key: string]: string };
}

export function PodiumSection({ users, podiumAnims, categoryColor, colors }: PodiumSectionProps) {
  const top3 = users.slice(0, 3);
  if (top3.length < 3) return null;

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  return (
    <View style={styles.podiumContainer}>
      <View style={styles.podiumRow}>
        {podiumOrder.map((index) => {
          const user = top3[index];
          if (!user) return null;

          const podiumHeight = [160, 120, 100][index];
          const avatarSize = [80, 64, 56][index];

          const translateY = podiumAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          });

          const scale = podiumAnims[index].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.5, 1.1, 1],
          });

          return (
            <Animated.View
              key={user.id}
              style={[
                styles.podiumItem,
                {
                  transform: [{ translateY }, { scale }],
                  opacity: podiumAnims[index],
                },
              ]}
            >
              {index === 0 && <Text style={styles.crown}>👑</Text>}

              <AnimatedAvatar
                source={
                  getValidImageUrl(user.avatar_url)
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    ? { uri: getValidImageUrl(user.avatar_url)! }
                    : require('../../../assets/default-avatar.png')
                }
                size={avatarSize}
                borderAnimation={index === 0 ? 'rainbow' : index === 1 ? 'glow' : 'gradient'}
                shape="circle"
                particleEffect={index === 0 ? 'sparkles' : 'none'}
                levelBadge={user.level}
                isPremium={user.is_premium}
              />

              <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {user.display_name || user.username}
              </Text>

              <Text style={[styles.podiumValue, { color: categoryColor }]}>
                {formatKarma(user.karma)}
              </Text>

              <View style={[styles.podiumBase, { height: podiumHeight }]}>
                <LinearGradient
                  colors={[
                    index === 0 ? '#fbbf24' : index === 1 ? '#6b7280' : '#d97706',
                    index === 0 ? '#f59e0b' : index === 1 ? '#4b5563' : '#b45309',
                  ]}
                  style={styles.podiumGradient}
                >
                  <Text style={styles.podiumRank}>{['1st', '2nd', '3rd'][index]}</Text>
                  <Text style={styles.podiumBadge}>{['🏆', '🥈', '🥉'][index]}</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  podiumContainer: { paddingVertical: 24, alignItems: 'center' },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  podiumItem: { alignItems: 'center', marginHorizontal: 8 },
  crown: { fontSize: 28, marginBottom: 8 },
  podiumName: { fontSize: 14, fontWeight: '600', marginTop: 8, maxWidth: 90, textAlign: 'center' },
  podiumValue: { fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: 8 },
  podiumBase: {
    width: SCREEN_WIDTH / 3.5, borderTopLeftRadius: 12,
    borderTopRightRadius: 12, overflow: 'hidden',
  },
  podiumGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  podiumRank: { fontSize: 16, fontWeight: '700', color: '#fff' },
  podiumBadge: { fontSize: 24, marginTop: 4 },
});
