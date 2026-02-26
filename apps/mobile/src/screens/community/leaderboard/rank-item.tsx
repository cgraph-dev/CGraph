import { durations } from '@cgraph/animation-constants';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AnimatedAvatar from '../../../components/ui/animated-avatar';
import { getValidImageUrl } from '../../../lib/imageUtils';
import { LeaderboardUser, LeaderboardCategory, CATEGORIES, formatKarma } from './leaderboard-types';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <LinearGradient colors={['#fbbf24', '#f59e0b']} style={[styles.rankBadge, styles.rankGold]}>
        <Ionicons name="trophy" size={18} color="#fff" />
      </LinearGradient>
    );
  }
  if (rank === 2) {
    return (
      <LinearGradient colors={['#9ca3af', '#6b7280']} style={[styles.rankBadge, styles.rankSilver]}>
        <Text style={styles.rankText}>2</Text>
      </LinearGradient>
    );
  }
  if (rank === 3) {
    return (
      <LinearGradient colors={['#d97706', '#b45309']} style={[styles.rankBadge, styles.rankBronze]}>
        <Text style={styles.rankText}>3</Text>
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.rankBadge, styles.rankDefault]}>
      <Text style={styles.rankTextSmall}>#{rank}</Text>
    </View>
  );
}

function RankChangeIndicator({ current, previous }: { current: number; previous?: number }) {
  if (!previous || current === previous) return null;
  const change = previous - current;
  const isUp = change > 0;
  return (
    <View style={styles.rankChangeContainer}>
      <Ionicons name={isUp ? 'caret-up' : 'caret-down'} size={12} color={isUp ? '#10b981' : '#ef4444'} />
      <Text style={[styles.rankChangeText, { color: isUp ? '#10b981' : '#ef4444' }]}>
        {Math.abs(change)}
      </Text>
    </View>
  );
}

interface RankItemProps {
  item: LeaderboardUser;
  index: number;
  category: LeaderboardCategory;
  categoryColor: string;
  colors: Record<string, string>;
  onPress: (userId: string) => void;
}

export function RankItem({ item, index, category, categoryColor, colors, onPress }: RankItemProps) {
  const isTopThree = item.rank <= 3;
  const itemAnim = new Animated.Value(0);
  Animated.timing(itemAnim, {
    toValue: 1,
    duration: durations.slow.ms,
    delay: index * 30,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View
      style={{
        opacity: itemAnim,
        transform: [{ translateX: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.userCard,
          { backgroundColor: colors.surface },
          isTopThree && [styles.userCardHighlight, { borderColor: categoryColor + '40' }],
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item.id);
        }}
      >
        <View style={styles.rankWrapper}>
          <RankBadge rank={item.rank} />
          <RankChangeIndicator current={item.rank} previous={item.previousRank} />
        </View>

        {item.is_premium || isTopThree ? (
          <AnimatedAvatar
            source={
              getValidImageUrl(item.avatar_url)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ? { uri: getValidImageUrl(item.avatar_url)! }
                : require('../../../assets/default-avatar.png')
            }
            size={44}
            borderAnimation={isTopThree ? (item.rank === 1 ? 'rainbow' : 'gradient') : 'glow'}
            shape="circle"
            levelBadge={item.level}
            isPremium={item.is_premium}
          />
        ) : getValidImageUrl(item.avatar_url) ? (
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          <Image source={{ uri: getValidImageUrl(item.avatar_url)! }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(item.display_name || item.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {item.display_name || item.username || 'Anonymous'}
            </Text>
            {item.is_verified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
            {item.is_premium && <Ionicons name="star" size={14} color="#f59e0b" />}
          </View>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{item.username}</Text>
        </View>

        <View style={[styles.karmaBadge, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons
            name={CATEGORIES.find(c => c.key === category)?.icon || 'trophy'}
            size={14}
            color={categoryColor}
          />
          <Text style={[styles.karmaText, { color: categoryColor }]}>{formatKarma(item.karma)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rankChangeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rankChangeText: { fontSize: 10, fontWeight: '600' },
  rankWrapper: { alignItems: 'center', marginRight: 12 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    marginHorizontal: 16, marginVertical: 4, borderRadius: 12,
  },
  userCardHighlight: { borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  rankBadge: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankGold: { backgroundColor: '#F59E0B' },
  rankSilver: { backgroundColor: '#9CA3AF' },
  rankBronze: { backgroundColor: '#D97706' },
  rankDefault: { backgroundColor: '#374151' },
  rankText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rankTextSmall: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  displayName: { fontSize: 16, fontWeight: '600' },
  username: { fontSize: 13, marginTop: 2 },
  karmaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
  },
  karmaText: { fontSize: 14, fontWeight: '600' },
});
