/**
 * FriendListScreen - Premium UI with Glassmorphism & Animations
 * Features: AnimatedAvatar, GlassCard, smooth animations, haptic feedback
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import socketManager from '../../lib/socket';
import { UserBasic, FriendsStackParamList } from '../../types';
import { EmptyState, LoadingSpinner } from '../../components';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList>;

interface FriendItem {
  id: string;
  user: UserBasic;
}

// Animated Friend Item Component
const AnimatedFriendItem = ({
  item,
  index,
  onPress,
  colors,
  isOnline,
}: {
  item: FriendItem;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  isOnline: boolean;
}) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const displayName = item.user.display_name || item.user.username || 'User';
  const avatarUrl = item.user.avatar_url;
  const isPremium = (item.user as Record<string, unknown>).is_premium || false;

  const getBorderAnimation = (): 'none' | 'glow' | 'holographic' | 'rainbow' => {
    if (isPremium) return 'holographic';
    if (isOnline) return 'glow';
    return 'none';
  };

  return (
    <Animated.View
      style={[
        styles.friendItemWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <GlassCard
          variant={isOnline ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.friendCard}
          glowColor={isOnline ? '#22c55e' : undefined}
        >
          <View style={styles.friendInner}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              {avatarUrl ? (
                <AnimatedAvatar
                  source={{ uri: avatarUrl }}
                  size={50}
                  borderAnimation={getBorderAnimation()}
                  shape="circle"
                  showStatus={true}
                  isOnline={isOnline}
                  isPremium={isPremium}
                  glowIntensity={0.6}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <LinearGradient
                    colors={isPremium ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.friendInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {isPremium && (
                  <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={10} color="#fff" />
                  </LinearGradient>
                )}
              </View>
              <Text
                style={[styles.friendUsername, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                @{item.user.username || item.user.id?.slice(0, 8) || 'unknown'}
              </Text>
            </View>

            {/* Status indicator */}
            <View style={styles.statusSection}>
              {isOnline ? (
                <View style={styles.onlineStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FriendListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends');
      const rawFriends = response.data?.friends || response.data || [];
      const friendsList = Array.isArray(rawFriends) ? rawFriends : [];
      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      setFriends([]);
      setFilteredFriends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/friends/pending');
      const requests = response.data?.data || response.data?.requests || [];
      if (!Array.isArray(requests)) {
        setPendingCount(0);
        return;
      }
      setPendingCount(requests.length);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  useEffect(() => {
    setOnlineFriends(new Set(socketManager.getOnlineFriends()));

    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline) => {
      setOnlineFriends((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      const friendUserIds = friends.map((f) => f.user.id).filter(Boolean);
      if (friendUserIds.length > 0) {
        socketManager.getBulkFriendStatus(friendUserIds).then((presenceMap) => {
          const online = new Set<string>();
          Object.entries(presenceMap).forEach(([userId, data]) => {
            if (data.online && !data.hidden) {
              online.add(userId);
            }
          });
          setOnlineFriends(online);
        });
      }
    }
  }, [friends]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (f) =>
            (f.user.username?.toLowerCase() || '').includes(query) ||
            (f.user.display_name?.toLowerCase() || '').includes(query)
        )
      );
    }
  }, [searchQuery, friends]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchFriends();
    fetchPendingCount();
  }, [fetchFriends, fetchPendingCount]);

  const handleFriendPress = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const renderFriend = ({ item, index }: { item: FriendItem; index: number }) => {
    const isOnline = onlineFriends.has(item.user.id);

    return (
      <AnimatedFriendItem
        item={item}
        index={index}
        onPress={() => handleFriendPress(item.user.id)}
        colors={colors}
        isOnline={isOnline}
      />
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Count online friends
  const onlineCount = friends.filter((f) => onlineFriends.has(f.user.id)).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Premium Search Bar */}
      <View style={styles.searchContainer}>
        <GlassCard variant="frosted" intensity="subtle" style={styles.searchCard}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search friends..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
      </View>

      {/* Online Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {onlineCount} Online
          </Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {friends.length - onlineCount} Offline
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonWrapper}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('AddFriend');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Add Friend</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonWrapper}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('FriendRequests');
          }}
          activeOpacity={0.8}
        >
          <GlassCard variant="frosted" intensity="subtle" style={styles.actionCardButton}>
            <View style={styles.actionCardInner}>
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text style={[styles.actionCardText, { color: colors.text }]}>Requests</Text>
              {pendingCount > 0 && (
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </LinearGradient>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonWrapper}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Leaderboard');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.actionButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="trophy" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Top Users</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={[
          styles.listContent,
          filteredFriends.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard variant="crystal" intensity="medium" style={styles.emptyCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyIcon}>
                <Ionicons name="people" size={40} color="#fff" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Add friends to start chatting!'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('AddFriend');
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.emptyButton}>
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={styles.emptyButtonText}>Add Friend</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </GlassCard>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchCard: {
    borderRadius: 16,
    padding: 0,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionCardButton: {
    borderRadius: 14,
    padding: 0,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionCardText: {
    fontWeight: '700',
    fontSize: 13,
  },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  friendItemWrapper: {
    marginBottom: 10,
  },
  friendCard: {
    borderRadius: 16,
    padding: 0,
  },
  friendInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarSection: {
    marginRight: 12,
  },
  avatarFallback: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111827',
  },
  friendInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  premiumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  statusSection: {
    marginLeft: 8,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    maxWidth: 300,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
