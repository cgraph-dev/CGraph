/**
 * Forum list screen showing all available forum categories and boards.
 * @module screens/forums/forum-list-screen
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import GlassCard from '../../components/ui/glass-card';
import { ForumCardSkeleton } from '../../components/skeleton';
import api from '../../lib/api';
import { ForumsStackParamList, Forum } from '../../types';
import { styles } from './forum-list-screen/styles';
import { AnimatedForumItem } from './forum-list-screen/components/animated-forum-item';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumList'>;
};

/**
 * Forum List Screen component.
 *
 */
export default function ForumListScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const [forums, setForums] = useState<Forum[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchForums();
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: durations.slower.ms,
        useNativeDriver: true,
      }),
      Animated.spring(headerTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchForums = async () => {
    try {
      setError(null);
      const response = await api.get('/api/v1/forums');
      setForums(response.data.data || []);
    } catch (err) {
      console.error('Error fetching forums:', err);
      setError('Failed to load forums. Pull down to retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchForums();
    setRefreshing(false);
  };

  const renderForum = ({ item, index }: { item: Forum; index: number }) => (
    <AnimatedForumItem
      item={item}
      index={index}
      colors={colors}
      onPress={() => navigation.navigate('Forum', { forumId: item.id })}
    />
  );

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#ef4444', '#f87171', '#fca5a5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="cloud-offline" size={48} color="#fff" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <View style={styles.emptyButtons}>
            <TouchableOpacity
              onPress={() => {
                setIsLoading(true);
                fetchForums();
              }}
            >
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyButton}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a855f7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconContainer}
        >
          <Ionicons name="newspaper" size={48} color="#fff" />
        </LinearGradient>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Forums Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Be the first to create a community!
        </Text>
        <View style={styles.emptyButtons}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('CreateForum');
            }}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButton}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Forum</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
      ]}
    >
      <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
            Search communities...
          </Text>
        </TouchableOpacity>
      </GlassCard>
      <View style={styles.categoriesRow}>
        {['Popular', 'New', 'Growing'].map((category, index) => (
          <TouchableOpacity
            key={category}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            {index === 0 ? (
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryChipActive}
              >
                <Text style={styles.categoryTextActive}>{category}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.categoryChip, { backgroundColor: colors.surface }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {category}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <ForumCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={forums}
        renderItem={renderForum}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={['#3b82f6', '#8b5cf6']}
          />
        }
        contentContainerStyle={[styles.listContent, forums.length === 0 && styles.emptyContainer]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('CreateForum');
          }}
        >
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
