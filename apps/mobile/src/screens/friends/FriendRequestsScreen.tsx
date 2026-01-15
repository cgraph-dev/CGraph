/**
 * FriendRequestsScreen - Revolutionary Mobile Edition
 *
 * Enhanced friend requests management with next-gen interactions:
 * - Swipeable cards (left: decline, right: accept)
 * - Spring physics animations with bounce
 * - Animated glassmorphism request cards
 * - Gradient tabs with haptic feedback
 * - Animated accept/decline buttons with shimmer
 * - Pull-to-refresh with custom animation
 * - Staggered slide-in animations
 * - Premium empty states with floating icons
 *
 * @version 2.0.0 - Revolutionary Edition
 * @since v0.9.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { FriendRequest } from '../../types';
import { Header, LoadingSpinner } from '../../components';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import { getValidImageUrl } from '../../lib/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'incoming' | 'outgoing';

// Swipeable Request Card Component with enhanced gestures
function RequestCard({
  item,
  index,
  onAccept,
  onDecline,
  processingId,
  isIncoming,
}: {
  item: FriendRequest;
  index: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  processingId: string | null;
  isIncoming: boolean;
}) {
  // Entry animations
  const entryAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Swipe animations
  const swipeX = useRef(new Animated.Value(0)).current;
  const acceptBgOpacity = useRef(new Animated.Value(0)).current;
  const declineBgOpacity = useRef(new Animated.Value(0)).current;
  const actionIconScale = useRef(new Animated.Value(0.5)).current;

  // Press animations
  const pressScale = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;
  const declineScale = useRef(new Animated.Value(1)).current;

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0)).current;

  const SWIPE_THRESHOLD = 100;

  useEffect(() => {
    // Staggered entry with bounce
    const delay = index * 80;

    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    // Avatar glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [index]);

  // Pan responder for swipe gestures (only for incoming requests)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isIncoming && Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = Math.max(-150, Math.min(150, gestureState.dx));
        swipeX.setValue(clampedX);

        // Show action backgrounds
        if (gestureState.dx > 20) {
          // Swiping right - Accept
          const progress = Math.min(1, gestureState.dx / SWIPE_THRESHOLD);
          acceptBgOpacity.setValue(progress);
          declineBgOpacity.setValue(0);
          actionIconScale.setValue(0.5 + progress * 0.5);
        } else if (gestureState.dx < -20) {
          // Swiping left - Decline
          const progress = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
          declineBgOpacity.setValue(progress);
          acceptBgOpacity.setValue(0);
          actionIconScale.setValue(0.5 + progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Accept
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(swipeX, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onAccept(item.id));
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Decline
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.timing(swipeX, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onDecline(item.id));
        } else {
          // Snap back
          Animated.spring(swipeX, {
            toValue: 0,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }

        // Reset backgrounds
        Animated.parallel([
          Animated.timing(acceptBgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(declineBgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(actionIconScale, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  const handleAcceptPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(acceptScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(acceptScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(acceptScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => onAccept(item.id));
  };

  const handleDeclinePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(declineScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(declineScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(declineScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => onDecline(item.id));
  };

  const displayName = item.user.display_name || item.user.username || 'Unknown';
  const handle = item.user.username || item.user.id?.slice(0, 8) || 'unknown';
  const isProcessing = processingId === item.id;
  const avatarUrl = getValidImageUrl(item.user.avatar_url);

  const entryTranslateX = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const cardRotate = swipeX.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: ['-3deg', '0deg', '3deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.requestCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: entryTranslateX },
            { scale: entryScale },
          ],
        },
      ]}
    >
      {/* Swipe action backgrounds */}
      {isIncoming && (
        <View style={styles.swipeActionsContainer}>
          {/* Accept background (right swipe) */}
          <Animated.View
            style={[
              styles.swipeActionBg,
              styles.acceptActionBg,
              { opacity: acceptBgOpacity },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: actionIconScale }] }}>
              <Ionicons name="checkmark-circle" size={32} color="#FFF" />
            </Animated.View>
            <Text style={styles.swipeActionLabel}>Accept</Text>
          </Animated.View>

          {/* Decline background (left swipe) */}
          <Animated.View
            style={[
              styles.swipeActionBg,
              styles.declineActionBg,
              { opacity: declineBgOpacity },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: actionIconScale }] }}>
              <Ionicons name="close-circle" size={32} color="#FFF" />
            </Animated.View>
            <Text style={styles.swipeActionLabel}>Decline</Text>
          </Animated.View>
        </View>
      )}

      {/* Main card */}
      <Animated.View
        style={[
          styles.swipeableCardWrapper,
          {
            transform: [
              { translateX: swipeX },
              { rotate: cardRotate },
              { scale: pressScale },
            ],
          },
        ]}
        {...(isIncoming ? panResponder.panHandlers : {})}
      >
        <GlassCard variant="neon" intensity="subtle" style={styles.cardInner}>
          {/* Avatar with glow */}
          <View style={styles.avatarContainer}>
            <Animated.View
              style={[
                styles.avatarGlow,
                {
                  opacity: avatarGlow,
                  backgroundColor: isIncoming ? '#22C55E' : '#3B82F6',
                },
              ]}
            />
            <AnimatedAvatar
              source={avatarUrl ? { uri: avatarUrl } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5CF6&color=fff&size=128` }}
              size={56}
              borderAnimation={isIncoming ? 'pulse' : 'gradient'}
              showStatus={true}
              isOnline={item.user.status === 'online'}
              glowIntensity={0.3}
            />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{handle}
            </Text>
            {item.created_at && (
              <Text style={styles.timestamp}>
                {formatTimeAgo(item.created_at)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isIncoming ? (
              <>
                <Animated.View style={{ transform: [{ scale: acceptScale }] }}>
                  <TouchableOpacity
                    onPress={handleAcceptPress}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#22C55E', '#10B981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: declineScale }] }}>
                  <TouchableOpacity
                    onPress={handleDeclinePress}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionButton, styles.declineButton]}>
                      <Ionicons name="close" size={20} color="#EF4444" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <Animated.View style={{ transform: [{ scale: declineScale }] }}>
                <TouchableOpacity
                  onPress={handleDeclinePress}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionButton, styles.cancelButton]}>
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Swipe hint for incoming */}
          {isIncoming && (
            <View style={styles.swipeHintContainer}>
              <Ionicons name="swap-horizontal" size={12} color="#6B7280" />
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

// Empty State Component
function EmptyRequestsState({ type }: { type: TabType }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const isIncoming = type === 'incoming';

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyIconContainer,
          {
            transform: [
              { scale: pulseAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={isIncoming ? ['#8B5CF6', '#6366F1'] : ['#06B6D4', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Ionicons
            name={isIncoming ? 'mail-outline' : 'paper-plane-outline'}
            size={48}
            color="#FFF"
          />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.emptyTitle}>
        {isIncoming ? 'No incoming requests' : 'No sent requests'}
      </Text>
      <Text style={styles.emptyDescription}>
        {isIncoming
          ? 'Friend requests you receive will appear here'
          : 'Friend requests you send will appear here'}
      </Text>
    </View>
  );
}

// Helper function
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function FriendRequestsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Header entrance animation
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(statsScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Tab indicator animation
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'incoming' ? 0 : 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const fetchRequests = useCallback(async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/api/v1/friends/requests'),
        api.get('/api/v1/friends/sent'),
      ]);
      
      // Normalize incoming requests
      const incomingData = incomingRes.data?.data || incomingRes.data?.requests || incomingRes.data || [];
      const normalizedIncoming = (Array.isArray(incomingData) ? incomingData : []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        user: r.from ? {
          id: (r.from as Record<string, unknown>).id as string,
          username: (r.from as Record<string, unknown>).username as string || 'Unknown',
          display_name: (r.from as Record<string, unknown>).display_name as string | null,
          avatar_url: (r.from as Record<string, unknown>).avatar_url as string | null,
          status: ((r.from as Record<string, unknown>).status as string) || 'offline',
        } : { id: 'unknown', username: 'Unknown', display_name: null, avatar_url: null, status: 'offline' },
        type: 'incoming' as const,
        created_at: r.sent_at as string,
      }));
      
      // Normalize outgoing requests
      const outgoingData = outgoingRes.data?.data || outgoingRes.data?.requests || outgoingRes.data || [];
      const normalizedOutgoing = (Array.isArray(outgoingData) ? outgoingData : []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        user: r.to ? {
          id: (r.to as Record<string, unknown>).id as string,
          username: (r.to as Record<string, unknown>).username as string || 'Unknown',
          display_name: (r.to as Record<string, unknown>).display_name as string | null,
          avatar_url: (r.to as Record<string, unknown>).avatar_url as string | null,
          status: ((r.to as Record<string, unknown>).status as string) || 'offline',
        } : { id: 'unknown', username: 'Unknown', display_name: null, avatar_url: null, status: 'offline' },
        type: 'outgoing' as const,
        created_at: r.sent_at as string,
      }));
      
      setIncomingRequests(normalizedIncoming);
      setOutgoingRequests(normalizedOutgoing);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post(`/api/v1/friends/${requestId}/accept`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.post(`/api/v1/friends/${requestId}/decline`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTabPress = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  const indicatorTranslateX = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
  });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Friend Requests"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Stats Header */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: headerOpacity,
            transform: [{ scale: statsScale }],
          },
        ]}
      >
        <GlassCard variant="frosted" intensity="subtle" style={styles.statsCard}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.statIcon}
            >
              <Ionicons name="arrow-down" size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statNumber}>{incomingRequests.length}</Text>
            <Text style={styles.statLabel}>Incoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              style={styles.statIcon}
            >
              <Ionicons name="arrow-up" size={16} color="#FFF" />
            </LinearGradient>
            <Text style={styles.statNumber}>{outgoingRequests.length}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Premium Tabs */}
      <View style={styles.tabsWrapper}>
        <GlassCard variant="frosted" intensity="medium" style={styles.tabsContainer}>
          {/* Animated Indicator */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={activeTab === 'incoming' ? ['#8B5CF6', '#6366F1'] : ['#06B6D4', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabIndicatorGradient}
            />
          </Animated.View>

          {/* Tab Buttons */}
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('incoming')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={activeTab === 'incoming' ? '#FFF' : '#9CA3AF'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'incoming' && styles.tabTextActive,
            ]}>
              Incoming
            </Text>
            {incomingRequests.length > 0 && (
              <View style={[
                styles.badge,
                activeTab === 'incoming' && styles.badgeActive,
              ]}>
                <Text style={styles.badgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('outgoing')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up-circle"
              size={20}
              color={activeTab === 'outgoing' ? '#FFF' : '#9CA3AF'}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'outgoing' && styles.tabTextActive,
            ]}>
              Sent
            </Text>
            {outgoingRequests.length > 0 && (
              <View style={[
                styles.badge,
                activeTab === 'outgoing' && styles.badgeActive,
              ]}>
                <Text style={styles.badgeText}>{outgoingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* Request List */}
      <FlatList
        data={currentRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RequestCard
            item={item}
            index={index}
            onAccept={handleAccept}
            onDecline={handleDecline}
            processingId={processingId}
            isIncoming={activeTab === 'incoming'}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
        ListEmptyComponent={<EmptyRequestsState type={activeTab} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    paddingRight: 4,
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#FFF',
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  requestCard: {
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 12,
    width: 'auto',
  },
  cancelText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Swipeable card styles
  swipeActionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  swipeActionBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  acceptActionBg: {
    backgroundColor: '#22C55E',
  },
  declineActionBg: {
    backgroundColor: '#EF4444',
  },
  swipeActionLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeableCardWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 34,
    opacity: 0.4,
  },
  swipeHintContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    opacity: 0.5,
  },
});
