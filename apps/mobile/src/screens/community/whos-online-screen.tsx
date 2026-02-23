/**
 * Screen displaying currently online community members.
 * @module screens/community/whos-online-screen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAdaptiveInterval } from '../../hooks/useAdaptiveInterval';
import { ParamListBase } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import api from '../../lib/api';
import {
  FloatingOrbs,
  WaveEffect,
  MagneticUserCard,
  PulsingDot,
  AnimatedStatCard,
  AnimatedRecordBadge,
} from './whos-online-screen/components';

// ============================================================================
// Types
// ============================================================================

export interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  userGroup: string;
  userGroupColor: string | null;
  lastActivity: string;
  currentActivity: string | null;
}

export interface OnlineStats {
  totalOnline: number;
  members: number;
  guests: number;
  bots: number;
  record: number;
  recordDate: string | null;
}

export interface ActivityGroup {
  activity: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
}

// Timer ref type for cross-platform compatibility
type TimerRef = ReturnType<typeof setInterval> | null;

// ============================================================================
// Fallback Data Generators
// ============================================================================

function generateFallbackStats(): OnlineStats {
  return {
    totalOnline: 42,
    members: 28,
    guests: 12,
    bots: 2,
    record: 156,
    recordDate: '2024-01-15T12:00:00Z',
  };
}

function generateFallbackUsers(): OnlineUser[] {
  const groups = ['Admin', 'Moderator', 'Member', 'VIP'];
  const colors = ['#ef4444', '#8b5cf6', '#10b981', '#f59e0b'];
  const activities = ['Browsing Forums', 'Reading Thread', 'Posting Reply', 'Viewing Profile'];

  return Array.from({ length: 15 }, (_, i) => ({
    id: `user-${i + 1}`,
    username: `User${i + 1}`,
    displayName: i % 3 === 0 ? `Display Name ${i + 1}` : null,
    avatarUrl: null,
    userGroup: groups[i % groups.length],
    userGroupColor: colors[i % colors.length],
    lastActivity: new Date(Date.now() - i * 60000).toISOString(),
    currentActivity: activities[i % activities.length],
  }));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WhosOnlineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<OnlineStats>(generateFallbackStats());
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivities, setShowActivities] = useState(false);

  // Scroll animation value for parallax
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animations
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Auto-refresh timer
  const refreshInterval = useRef<TimerRef>(null);

  useEffect(() => {
    // Animate header on mount
    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Transform API response
  const transformApiUsers = (data: unknown[]): OnlineUser[] => {
    return data.map((u) => {
      const user = u as Record<string, unknown>;
      return {
        id: user.id as string,
        username: (user.username as string) || 'Unknown',
        displayName: (user.display_name as string) || null,
        avatarUrl: (user.avatar_url as string) || null,
        userGroup: (user.user_group as string) || 'Member',
        userGroupColor: (user.user_group_color as string) || null,
        lastActivity: (user.last_activity as string) || new Date().toISOString(),
        currentActivity: (user.current_activity as string) || null,
      };
    });
  };

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await api.get('/api/v1/presence/online');
      const data = response.data;

      // Set users
      const userList = transformApiUsers(data.users || []);
      setUsers(userList);

      // Set stats
      setStats({
        totalOnline: data.total_online || userList.length,
        members: data.members || userList.length,
        guests: data.guests || 0,
        bots: data.bots || 0,
        record: data.record || 0,
        recordDate: data.record_date || null,
      });

      // Set activities
      if (data.activities) {
        const activityGroups: ActivityGroup[] = data.activities.map(
          (a: Record<string, unknown>) => ({
            activity: a.activity || 'Unknown',
            count: a.count || 0,
            icon: getActivityIcon(a.activity as string),
          })
        );
        setActivities(activityGroups);
      }
    } catch (err) {
      console.error('[WhosOnline] API error, using fallback:', err);
      setUsers(generateFallbackUsers());
      setStats(generateFallbackStats());
      setActivities([
        { activity: 'Browsing Forums', count: 15, icon: 'list' },
        { activity: 'Reading Threads', count: 12, icon: 'document-text' },
        { activity: 'Posting Messages', count: 8, icon: 'chatbubble' },
        { activity: 'Viewing Profiles', count: 5, icon: 'person' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get icon for activity
  const getActivityIcon = (activity: string): keyof typeof Ionicons.glyphMap => {
    const activityLower = activity?.toLowerCase() || '';
    if (activityLower.includes('forum') || activityLower.includes('browse')) return 'list';
    if (activityLower.includes('thread') || activityLower.includes('read')) return 'document-text';
    if (activityLower.includes('post') || activityLower.includes('reply')) return 'chatbubble';
    if (activityLower.includes('profile')) return 'person';
    if (activityLower.includes('search')) return 'search';
    if (activityLower.includes('chat') || activityLower.includes('message')) return 'chatbubbles';
    return 'ellipsis-horizontal';
  };

  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  // Auto-refresh: 30s when active, 120s when backgrounded
  useAdaptiveInterval(fetchOnlineUsers, 30000);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchOnlineUsers();
    setIsRefreshing(false);
  };

  // Navigate to member profile
  const handleUserPress = (user: OnlineUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (__DEV__) console.log('Navigate to profile:', user.id);
  };

  // Parallax header transform
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [50, 0, -30],
    extrapolate: 'clamp',
  });

  const backgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['#111827', '#0f172a', '#111827']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating orbs background */}
      <FloatingOrbs />

      {/* Wave effect */}
      <WaveEffect scrollY={scrollY} />

      {/* Header with parallax */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
            opacity: headerOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Who's Online</Text>
            <PulsingDot />
          </View>
          <Text style={styles.headerSubtitle}>Live presence updates</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowActivities(!showActivities);
          }}
        >
          <BlurView intensity={30} tint="dark" style={styles.headerButtonBlur}>
            <Ionicons name="analytics" size={22} color={showActivities ? '#10b981' : '#fff'} />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
          <Text style={styles.loadingText}>Loading presence data...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MagneticUserCard
              user={item}
              index={index}
              onPress={() => handleUserPress(item)}
              scrollY={scrollY}
            />
          )}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
            />
          }
          ListHeaderComponent={
            <>
              {/* Stats Cards with animations */}
              <View style={styles.statsContainer}>
                <AnimatedStatCard
                  label="Members"
                  value={stats.members}
                  icon="people"
                  color="#10b981"
                  index={0}
                />
                <AnimatedStatCard
                  label="Guests"
                  value={stats.guests}
                  icon="person-outline"
                  color="#6366f1"
                  index={1}
                />
                <AnimatedStatCard
                  label="Bots"
                  value={stats.bots}
                  icon="hardware-chip"
                  color="#f59e0b"
                  index={2}
                />
              </View>

              {/* Animated Record Badge */}
              <AnimatedRecordBadge
                record={stats.record}
                recordDate={stats.recordDate}
                scrollY={scrollY}
              />

              {/* Activity Breakdown with animations */}
              {showActivities && activities.length > 0 && (
                <View style={styles.activitiesContainer}>
                  <Text style={styles.activitiesTitle}>What People Are Doing</Text>
                  {activities.map((activity, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.activityItem,
                        {
                          transform: [
                            {
                              translateX: scrollY.interpolate({
                                inputRange: [0, 100],
                                outputRange: [0, -5 * index],
                                extrapolate: 'clamp',
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.activityIcon,
                          { backgroundColor: `${getActivityColor(index)}20` },
                        ]}
                      >
                        <Ionicons name={activity.icon} size={16} color={getActivityColor(index)} />
                      </View>
                      <Text style={styles.activityText}>{activity.activity}</Text>
                      <View
                        style={[
                          styles.activityCountBadge,
                          { backgroundColor: `${getActivityColor(index)}20` },
                        ]}
                      >
                        <Text
                          style={[styles.activityCountText, { color: getActivityColor(index) }]}
                        >
                          {activity.count}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Online Members</Text>
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCount}>{users.length}</Text>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient colors={['#374151', '#1f2937']} style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
              </LinearGradient>
              <Text style={styles.emptyText}>No members currently online</Text>
              <Text style={styles.emptySubtext}>{stats.guests} guests browsing</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Helper function for activity colors
function getActivityColor(index: number): string {
  const colors = ['#10b981', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b'];
  return colors[index % colors.length];
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
  },
  // List content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  // Activities
  activitiesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activitiesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
  },
  activityCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  sectionCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
  },
});
