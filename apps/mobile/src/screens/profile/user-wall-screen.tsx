/**
 * UserWallScreen - Revolutionary Social Timeline
 * Features: Post creation, like/comment interactions, animated post cards, pull to refresh
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  _View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/lib/design/design-system';
import { useThemeStore, useAuthStore } from '@/stores';
import api from '@/lib/api';
import { type WallPost } from './user-wall-screen/types';
import { styles } from './user-wall-screen/styles';
import { WallPostItem } from './user-wall-screen/components/wall-post-item';
import { PostComposer } from './user-wall-screen/components/post-composer';

/**
 *
 */
export default function UserWallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useThemeStore();
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const composerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.smooth.ms,
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

  // Fetch wall posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      if (!currentUserId) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/users/${currentUserId}/posts`);
        setPosts(response.data?.data || response.data?.posts || []);
      } catch (err) {
        console.error('Error fetching wall posts:', err);
        setError('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [currentUserId]);

  useEffect(() => {
    Animated.timing(composerAnim, {
      toValue: showComposer ? 1 : 0,
      duration: durations.normal.ms,
      useNativeDriver: true,
    }).start();
  }, [showComposer]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const response = await api.get(`/api/v1/users/${currentUserId}/posts`);
      setPosts(response.data?.data || response.data?.posts || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing wall posts:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  const handleLike = useCallback((postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
          : post
      )
    );
  }, []);

  const handlePost = useCallback(() => {
    if (!newPostText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newPost: WallPost = {
      id: Date.now().toString(), userId: currentUserId, userName: 'You',
      userLevel: 15, isPremium: false, content: newPostText,
      likesCount: 0, commentsCount: 0, sharesCount: 0,
      isLiked: false, createdAt: new Date(), reactions: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
    setShowComposer(false);
  }, [newPostText]);

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
        <PostComposer
          showComposer={showComposer}
          composerAnim={composerAnim}
          newPostText={newPostText}
          setNewPostText={setNewPostText}
          onPost={handlePost}
          onClose={() => setShowComposer(false)}
          colors={{ text: colors.text, textSecondary: colors.textSecondary, textTertiary: colors.textTertiary, border: colors.border }}
        />
        <FlatList
          data={posts}
          renderItem={({ item, index }) => (
            <WallPostItem
              item={item}
              index={index}
              colors={{ text: colors.text, textSecondary: colors.textSecondary, border: colors.border }}
              onLike={handleLike}
              navigation={navigation}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
