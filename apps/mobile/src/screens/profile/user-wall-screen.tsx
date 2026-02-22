/**
 * UserWallScreen - Revolutionary Social Timeline
 * Features:
 * - Post creation with media
 * - Like and comment interactions
 * - Activity feed integration
 * - Animated post cards
 * - Pull to refresh
 * - Infinite scroll
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, type ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import AnimatedAvatar from '@/components/ui/animated-avatar';
import GlassCard from '@/components/ui/glass-card';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/lib/design/design-system';
import { useTheme } from '@/contexts/theme-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WallPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  isPremium: boolean;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: Date;
  reactions?: Array<{ emoji: string; count: number }>;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  isLiked: boolean;
}

// Mock data
const MOCK_POSTS: WallPost[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'CyberNinja',
    userLevel: 42,
    isPremium: true,
    content:
      'Just hit level 42! 🎉 The grind was worth it. Thanks to everyone who supported me along the way!',
    likesCount: 156,
    commentsCount: 23,
    sharesCount: 5,
    isLiked: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [
      { emoji: '🔥', count: 45 },
      { emoji: '👏', count: 32 },
      { emoji: '❤️', count: 79 },
    ],
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'PixelDragon',
    userLevel: 28,
    isPremium: false,
    content:
      'New achievement unlocked: "Night Owl" 🦉 Stayed up way too late but totally worth it!',
    imageUrl: 'https://picsum.photos/400/300',
    likesCount: 89,
    commentsCount: 12,
    sharesCount: 2,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: [
      { emoji: '😂', count: 15 },
      { emoji: '🎉', count: 24 },
    ],
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'MatrixHawk',
    userLevel: 55,
    isPremium: true,
    content: 'Pro tip: Use the keyboard shortcuts to navigate faster! Game changer 🚀',
    likesCount: 234,
    commentsCount: 45,
    sharesCount: 18,
    isLiked: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    reactions: [
      { emoji: '🧠', count: 67 },
      { emoji: '💯', count: 89 },
      { emoji: '🚀', count: 78 },
    ],
  },
];

export default function UserWallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<WallPost[]>(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const composerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(composerAnim, {
      toValue: showComposer ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showComposer]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLike = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      )
    );
  }, []);

  const handlePost = useCallback(() => {
    if (!newPostText.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPost: WallPost = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'You',
      userLevel: 15,
      isPremium: false,
      content: newPostText,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      createdAt: new Date(),
      reactions: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
    setShowComposer(false);
  }, [newPostText]);

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderPost = ({ item, index }: { item: WallPost; index: number }) => {
    const itemAnim = new Animated.Value(0);
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.postContainer,
          {
            opacity: itemAnim,
            transform: [
              {
                translateY: itemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <GlassCard variant="frosted" intensity="subtle" style={styles.postCard}>
          {/* Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity
              style={styles.postUser}
              onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            >
              <AnimatedAvatar
                source={
                  item.userAvatar
                    ? { uri: item.userAvatar }
                    : require('@/assets/default-avatar.png')
                }
                size={44}
                borderAnimation={item.isPremium ? 'glow' : 'none'}
                shape="circle"
                levelBadge={item.userLevel}
                isPremium={item.isPremium}
              />
              <View style={styles.postUserInfo}>
                <View style={styles.postUserNameRow}>
                  <Text style={[styles.postUserName, { color: colors.text }]}>{item.userName}</Text>
                  {item.isPremium && <Ionicons name="star" size={14} color={Colors.amber[500]} />}
                </View>
                <Text style={[styles.postTime, { color: colors.textSecondary }]}>
                  {formatTimestamp(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>

          {/* Image */}
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
          )}

          {/* Reactions */}
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsRow}>
              {item.reactions.map((reaction, i) => (
                <View key={i} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
                    {formatCount(reaction.count)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatCount(item.likesCount)} likes
            </Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatCount(item.commentsCount)} comments
            </Text>
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatCount(item.sharesCount)} shares
            </Text>
          </View>

          {/* Actions */}
          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={item.isLiked ? Colors.pink[500] : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: item.isLiked ? Colors.pink[500] : colors.textSecondary },
                ]}
              >
                Like
              </Text>
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
  };

  const renderComposer = () => (
    <Animated.View
      style={[
        styles.composerContainer,
        {
          opacity: composerAnim,
          transform: [
            {
              translateY: composerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents={showComposer ? 'auto' : 'none'}
    >
      <GlassCard variant="frosted" intensity="medium" style={styles.composerCard}>
        <View style={styles.composerHeader}>
          <Text style={[styles.composerTitle, { color: colors.text }]}>Create Post</Text>
          <TouchableOpacity onPress={() => setShowComposer(false)}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.composerInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textTertiary}
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
          numberOfLines={4}
        />

        <View style={styles.composerActions}>
          <View style={styles.composerMedia}>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="image" size={24} color={Colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="videocam" size={24} color={Colors.purple[500]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="happy" size={24} color={Colors.amber[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.postButton, !newPostText.trim() && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!newPostText.trim()}
          >
            <LinearGradient
              colors={
                newPostText.trim()
                  ? [Colors.primary[500], Colors.primary[600]]
                  : [Colors.dark[600], Colors.dark[700]]
              }
              style={styles.postButtonGradient}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Wall</Text>

      <TouchableOpacity
        style={[styles.newPostButton, { backgroundColor: Colors.primary[500] }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowComposer(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.newPostButtonText}>New Post</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        {renderComposer()}

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[500]}
            />
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing[20],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  newPostButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Composer
  composerContainer: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  composerCard: {
    padding: Spacing[4],
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  composerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  composerInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    fontSize: Typography.fontSize.base,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[3],
  },
  composerMedia: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  mediaButton: {
    padding: Spacing[2],
  },
  postButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonGradient: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[2],
  },
  postButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Post
  postContainer: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  postCard: {
    padding: Spacing[4],
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postUserInfo: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  postUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  postUserName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  postTime: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing[2],
  },
  postContent: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[3],
  },

  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark[700],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: Typography.fontSize.xs,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  statText: {
    fontSize: Typography.fontSize.sm,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
