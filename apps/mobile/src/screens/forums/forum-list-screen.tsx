/**
 * Forum list screen showing all available forum categories and boards.
 * @module screens/forums/forum-list-screen
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import GlassCard from '../../components/ui/glass-card';
import { ForumCardSkeleton } from '../../components/skeleton';
import api from '../../lib/api';
import { ForumsStackParamList, Forum } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumList'>;
};

// Animated forum item component
function AnimatedForumItem({
  item,
  index,
  colors,
  onPress,
}: {
  item: Forum;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 100;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isPopular = item.member_count > 1000;
  const isHot = item.post_count > 500;
  
  // Generate consistent gradient colors based on forum name
  const getForumGradient = (): [string, string] => {
    const gradients: [string, string][] = [
      ['#3b82f6', '#8b5cf6'],
      ['#10b981', '#34d399'],
      ['#f59e0b', '#fbbf24'],
      ['#ec4899', '#f472b6'],
      ['#06b6d4', '#22d3ee'],
      ['#8b5cf6', '#a855f7'],
      ['#ef4444', '#f87171'],
    ];
    const index = item.name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <Animated.View
      style={[
        styles.forumWrapper,
        {
          transform: [{ translateX }, { scale }],
          opacity,
        },
      ]}
    >
      <GlassCard
        variant={isPopular ? 'neon' : 'frosted'}
        intensity={isPopular ? 'medium' : 'subtle'}
        style={styles.forumCard}
      >
        <TouchableOpacity
          style={styles.forumInner}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {/* Forum Icon */}
          <View style={styles.forumIconWrapper}>
            {item.icon_url ? (
              <Image source={{ uri: item.icon_url }} style={styles.forumIconImage} />
            ) : (
              <LinearGradient
                colors={getForumGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.forumIconPlaceholder}
              >
                <Text style={styles.forumIconText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            
            {/* Badges */}
            {isPopular && (
              <LinearGradient
                colors={['#f59e0b', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.popularBadge}
              >
                <Ionicons name="star" size={8} color="#fff" />
              </LinearGradient>
            )}
          </View>

          {/* Forum Info */}
          <View style={styles.forumInfo}>
            <View style={styles.forumNameRow}>
              <Text style={[styles.forumName, { color: colors.text }]} numberOfLines={1}>
                c/{item.slug}
              </Text>
              {isHot && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>🔥</Text>
                </View>
              )}
            </View>
            
            {item.description && (
              <Text style={[styles.forumDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={12} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>
                  {formatCount(item.member_count)} members
                </Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.statItem}>
                <Ionicons name="newspaper" size={12} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>
                  {formatCount(item.post_count)} posts
                </Text>
              </View>
            </View>
          </View>

          {/* Arrow */}
          <LinearGradient
            colors={getForumGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.arrowContainer}
          >
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function ForumListScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const [forums, setForums] = useState<Forum[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchForums();
    
    // Animate header in
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate FAB in with delay
    setTimeout(() => {
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, 600);
  }, []);
  
  const fetchForums = async () => {
    try {
      const response = await api.get('/api/v1/forums');
      setForums(response.data.data || []);
    } catch (error) {
      console.error('Error fetching forums:', error);
      // Mock data for development
      setForums(getMockForums());
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
  
  const renderEmptyState = () => (
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
  
  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <ForumCardSkeleton key={i} />
      ))}
    </View>
  );

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      {/* Search Bar */}
      <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Navigate to search
          }}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
            Search communities...
          </Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Categories */}
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
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{category}</Text>
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
        {renderSkeletons()}
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
        contentContainerStyle={[
          styles.listContent,
          forums.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('CreateForum');
          }}
          activeOpacity={0.8}
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

function getMockForums(): Forum[] {
  return [
    {
      id: '1',
      name: 'Technology',
      slug: 'technology',
      description: 'Discuss the latest in tech',
      member_count: 15420,
      post_count: 8934,
      icon_url: '',
      is_public: true,
      flairs: [],
      inserted_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Gaming',
      slug: 'gaming',
      description: 'All about video games',
      member_count: 28500,
      post_count: 12500,
      icon_url: '',
      is_public: true,
      flairs: [],
      inserted_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Programming',
      slug: 'programming',
      description: 'Code discussions and help',
      member_count: 9800,
      post_count: 4500,
      icon_url: '',
      is_public: true,
      flairs: [],
      inserted_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Design',
      slug: 'design',
      description: 'UI/UX and graphic design',
      member_count: 5600,
      post_count: 2300,
      icon_url: '',
      is_public: true,
      flairs: [],
      inserted_at: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Music',
      slug: 'music',
      description: 'Share and discover music',
      member_count: 12300,
      post_count: 6700,
      icon_url: '',
      is_public: true,
      flairs: [],
      inserted_at: new Date().toISOString(),
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  searchCard: {
    borderRadius: 14,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  forumWrapper: {
    marginBottom: 12,
  },
  forumCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  forumInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  forumIconWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  forumIconImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  forumIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forumIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  forumInfo: {
    flex: 1,
  },
  forumNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  forumName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  hotBadge: {
    marginLeft: 6,
  },
  hotBadgeText: {
    fontSize: 12,
  },
  forumDescription: {
    fontSize: 13,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6b7280',
    marginHorizontal: 8,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButtons: {
    gap: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
