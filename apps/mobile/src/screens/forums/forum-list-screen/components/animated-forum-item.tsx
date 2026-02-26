import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import { styles } from '../styles';
import { formatCount, type Forum, type ForumColors } from '../helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  item: Forum;
  index: number;
  colors: ForumColors;
  onPress: () => void;
}

export function AnimatedForumItem({ item, index, colors, onPress }: Props) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0, duration: durations.smooth.ms, delay, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 350, delay, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, friction: 8, tension: 40, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isPopular = item.member_count > 1000;
  const isHot = item.post_count > 500;

  const getForumGradient = (): [string, string] => {
    const gradients: [string, string][] = [
      ['#3b82f6', '#8b5cf6'], ['#10b981', '#34d399'], ['#f59e0b', '#fbbf24'],
      ['#ec4899', '#f472b6'], ['#06b6d4', '#22d3ee'], ['#8b5cf6', '#a855f7'],
      ['#ef4444', '#f87171'],
    ];
    const idx = item.name.charCodeAt(0) % gradients.length;
    return gradients[idx];
  };

  return (
    <Animated.View style={[styles.forumWrapper, { transform: [{ translateX }, { scale }], opacity }]}>
      <GlassCard
        variant={isPopular ? 'neon' : 'frosted'}
        intensity={isPopular ? 'medium' : 'subtle'}
        style={styles.forumCard}
      >
        <TouchableOpacity style={styles.forumInner} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.forumIconWrapper}>
            {item.icon_url ? (
              <Image source={{ uri: item.icon_url }} style={styles.forumIconImage} />
            ) : (
              <LinearGradient colors={getForumGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.forumIconPlaceholder}>
                <Text style={styles.forumIconText}>{item.name.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            {isPopular && (
              <LinearGradient colors={['#f59e0b', '#fbbf24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.popularBadge}>
                <Ionicons name="star" size={8} color="#fff" />
              </LinearGradient>
            )}
          </View>

          <View style={styles.forumInfo}>
            <View style={styles.forumNameRow}>
              <Text style={[styles.forumName, { color: colors.text }]} numberOfLines={1}>c/{item.slug}</Text>
              {isHot && <View style={styles.hotBadge}><Text style={styles.hotBadgeText}>🔥</Text></View>}
            </View>
            {item.description && (
              <Text style={[styles.forumDescription, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={12} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>{formatCount(item.member_count)} members</Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.statItem}>
                <Ionicons name="newspaper" size={12} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>{formatCount(item.post_count)} posts</Text>
              </View>
            </View>
          </View>

          <LinearGradient colors={getForumGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}
