import { durations } from '@cgraph/animation-constants';
import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import AnimatedAvatar from '@/components/ui/animated-avatar';
import GlassCard from '@/components/ui/glass-card';
import { Colors } from '@/lib/design/design-system';
import { formatTimestamp, formatCount, type WallPost } from '../types';
import { styles } from '../styles';

interface Props {
  item: WallPost;
  index: number;
  colors: { text: string; textSecondary: string; border: string };
  onLike: (postId: string) => void;
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export function WallPostItem({ item, index, colors, onLike, navigation }: Props) {
  const itemAnim = new Animated.Value(0);
  Animated.timing(itemAnim, {
    toValue: 1,
    duration: durations.smooth.ms,
    delay: index * 100,
    useNativeDriver: true,
  }).start();

  return (
    <Animated.View style={[styles.postContainer, {
      opacity: itemAnim,
      transform: [{ translateY: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }]}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.postUser}
            onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}>
            <AnimatedAvatar
              source={item.userAvatar ? { uri: item.userAvatar }
                // @ts-expect-error - require returns number type
                : require('@/assets/default-avatar.png')}
              size={44} borderAnimation={item.isPremium ? 'glow' : 'none'}
              shape="circle" levelBadge={item.userLevel} isPremium={item.isPremium} />
            <View style={styles.postUserInfo}>
              <View style={styles.postUserNameRow}>
                <Text style={[styles.postUserName, { color: colors.text }]}>{item.userName}</Text>
                {item.isPremium && <Ionicons name="star" size={14} color={Colors.amber[500]} />}
              </View>
              <Text style={[styles.postTime, { color: colors.textSecondary }]}>{formatTimestamp(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />}

        {item.reactions && item.reactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {item.reactions.map((reaction, i) => (
              <View key={i} style={styles.reactionBadge}>
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>{formatCount(reaction.count)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{formatCount(item.likesCount)} likes</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{formatCount(item.commentsCount)} comments</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>{formatCount(item.sharesCount)} shares</Text>
        </View>

        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item.id)}>
            <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={22}
              color={item.isLiked ? Colors.pink[500] : colors.textSecondary} />
            <Text style={[styles.actionText, { color: item.isLiked ? Colors.pink[500] : colors.textSecondary }]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );
}
