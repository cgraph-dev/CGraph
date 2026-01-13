import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedAvatar from '../../components/ui/AnimatedAvatar';
import api from '../../lib/api';
import { safeFormatDistanceToNow } from '../../lib/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NotificationType = 'message' | 'friend_request' | 'friend_accepted' | 'mention' | 'group_invite' | 'forum_reply' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

type TabType = 'all' | 'unread' | 'messages' | 'mentions' | 'system';

type RootStackParamList = {
  NotificationsInbox: undefined;
  Conversation: { conversationId: string };
  UserProfile: { userId: string };
  GroupChannel: { groupId: string; channelId: string };
  ForumPost: { forumSlug: string; postId: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NotificationsInbox'>;
};

const typeIcons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble',
  friend_request: 'person-add',
  friend_accepted: 'people',
  mention: 'at',
  group_invite: 'people-circle',
  forum_reply: 'chatbubbles',
  system: 'shield-checkmark',
};

const typeGradients: Record<NotificationType, [string, string]> = {
  message: ['#3b82f6', '#06b6d4'],
  friend_request: ['#10b981', '#34d399'],
  friend_accepted: ['#10b981', '#059669'],
  mention: ['#f59e0b', '#fbbf24'],
  group_invite: ['#8b5cf6', '#a855f7'],
  forum_reply: ['#06b6d4', '#22d3ee'],
  system: ['#6366f1', '#818cf8'],
};

// Animated notification item component
function AnimatedNotificationItem({
  item,
  index,
  colors,
  isDark,
  onPress,
  onMarkRead,
  onDelete,
}: {
  item: Notification;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const delay = index * 80;
    
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

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDelete();
  };

  return (
    <Animated.View
      style={[
        styles.notificationWrapper,
        {
          transform: [{ translateX }, { scale }],
          opacity,
        },
      ]}
    >
      <GlassCard
        variant={item.read ? 'frosted' : 'neon'}
        intensity={item.read ? 'subtle' : 'medium'}
        style={styles.notificationCard}
      >
        <TouchableOpacity
          style={styles.notificationInner}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
        >
          {/* Icon with gradient background */}
          <LinearGradient
            colors={typeGradients[item.type]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons name={typeIcons[item.type]} size={20} color="#fff" />
          </LinearGradient>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: colors.text, fontWeight: item.read ? '500' : '700' },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && (
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.unreadDot}
                />
              )}
            </View>

            <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.body}
            </Text>

            <View style={styles.notificationFooter}>
              <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                {safeFormatDistanceToNow(item.createdAt)}
              </Text>
              
              {/* Sender avatar if available */}
              {item.sender?.avatarUrl && (
                <View style={styles.senderInfo}>
                  <AnimatedAvatar
                    source={{ uri: item.sender.avatarUrl }}
                    size={20}
                    borderAnimation="none"
                  />
                  <Text style={[styles.senderName, { color: colors.textTertiary }]}>
                    {item.sender.username}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              item.read ? onDelete() : onMarkRead();
            }}
          >
            <LinearGradient
              colors={item.read ? ['#ef4444', '#f87171'] : ['#10b981', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons
                name={item.read ? 'trash' : 'checkmark'}
                size={14}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

export default function NotificationsInboxScreen({ navigation }: Props) {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
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
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }

      // Map activeTab to proper API parameters
      // 'unread' should use filter param, others use type param
      const filter = activeTab === 'unread' ? 'unread' : 'all';
      const type = activeTab !== 'all' && activeTab !== 'unread' ? activeTab : undefined;

      const response = await api.get<{ data: Notification[]; hasMore: boolean }>('/api/v1/notifications', {
        params: {
          page: pageNum,
          limit: 20,
          filter,
          type,
        },
      });

      const responseData = response.data;
      if (pageNum === 1) {
        setNotifications(responseData.data);
      } else {
        setNotifications((prev) => [...prev, ...responseData.data]);
      }
      setHasMore(responseData.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (pageNum === 1) {
        setNotifications(getMockNotifications());
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications, activeTab]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.post(`/api/v1/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post('/api/v1/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          try {
            await api.delete(`/api/v1/notifications/${notificationId}`);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
          } catch (error) {
            console.error('Failed to delete notification:', error);
          }
        },
      },
    ]);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    switch (notification.type) {
      case 'message':
        if (notification.data?.conversationId) {
          navigation.navigate('Conversation', {
            conversationId: notification.data.conversationId as string,
          });
        }
        break;
      case 'friend_request':
      case 'friend_accepted':
        if (notification.sender?.id) {
          navigation.navigate('UserProfile', { userId: notification.sender.id });
        }
        break;
      case 'group_invite':
        if (notification.data?.groupId && notification.data?.channelId) {
          navigation.navigate('GroupChannel', {
            groupId: notification.data.groupId as string,
            channelId: notification.data.channelId as string,
          });
        }
        break;
      case 'forum_reply':
        if (notification.data?.forumSlug && notification.data?.postId) {
          navigation.navigate('ForumPost', {
            forumSlug: notification.data.forumSlug as string,
            postId: notification.data.postId as string,
          });
        }
        break;
    }
  };

  const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'all', label: 'All', icon: 'notifications' },
    { id: 'unread', label: 'Unread', icon: 'radio-button-on' },
    { id: 'messages', label: 'Messages', icon: 'chatbubble' },
    { id: 'mentions', label: 'Mentions', icon: 'at' },
    { id: 'system', label: 'System', icon: 'shield-checkmark' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case 'unread':
        return !n.read;
      case 'messages':
        return n.type === 'message';
      case 'mentions':
        return n.type === 'mention';
      case 'system':
        return n.type === 'system';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => (
    <AnimatedNotificationItem
      item={item}
      index={index}
      colors={colors}
      isDark={isDark}
      onPress={() => handleNotificationPress(item)}
      onMarkRead={() => handleMarkAsRead(item.id)}
      onDelete={() => handleDelete(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="notifications-off" size={48} color="#fff" />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {activeTab === 'unread'
          ? "You're all caught up! 🎉"
          : 'When you get notifications, they will appear here'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderTab = ({ item }: { item: typeof tabs[0] }) => {
    const isActive = activeTab === item.id;
    
    return (
      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setActiveTab(item.id);
        }}
      >
        {isActive ? (
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tab}
          >
            <Ionicons name={item.icon} size={16} color="#fff" />
            <Text style={[styles.tabText, { color: '#fff' }]}>{item.label}</Text>
            {item.id === 'unread' && unreadCount > 0 && (
              <View style={styles.tabBadgeActive}>
                <Text style={styles.tabBadgeTextActive}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.tab, { backgroundColor: colors.surface }]}>
            <Ionicons name={item.icon} size={16} color={colors.textSecondary} />
            <Text style={[styles.tabText, { color: colors.textSecondary }]}>{item.label}</Text>
            {item.id === 'unread' && unreadCount > 0 && (
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabBadge}
              >
                <Text style={styles.tabBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </LinearGradient>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconContainer}
              >
                <Ionicons name="notifications" size={22} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {unreadCount} unread
                  </Text>
                )}
              </View>
            </View>
            
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <LinearGradient
                  colors={['#10b981', '#34d399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.markAllButton}
                >
                  <Ionicons name="checkmark-done" size={16} color="#fff" />
                  <Text style={styles.markAllText}>Mark all</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContent}
          renderItem={renderTab}
        />
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={['#3b82f6', '#8b5cf6']}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function getMockNotifications(): Notification[] {
  return [
    {
      id: '1',
      type: 'message',
      title: 'New message from John Doe',
      body: 'Hey, are you coming to the meeting today?',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender: { id: '1', username: 'johndoe', avatarUrl: 'https://i.pravatar.cc/150?u=johndoe' },
      data: { conversationId: '1' },
    },
    {
      id: '2',
      type: 'friend_request',
      title: 'Friend request',
      body: 'Jane Smith wants to be your friend',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: { id: '2', username: 'janesmith', avatarUrl: 'https://i.pravatar.cc/150?u=janesmith' },
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned',
      body: '@you in General: Check out this new feature!',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: { id: '3', username: 'dev_team', avatarUrl: 'https://i.pravatar.cc/150?u=devteam' },
    },
    {
      id: '4',
      type: 'group_invite',
      title: 'Group invitation',
      body: 'You have been invited to join "React Developers"',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      data: { groupId: '1', channelId: '1' },
    },
    {
      id: '5',
      type: 'system',
      title: 'Security alert',
      body: 'New login detected from Chrome on Windows',
      read: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  markAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabsContainer: {
    marginBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabWrapper: {
    marginRight: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeTextActive: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  notificationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: 11,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderName: {
    fontSize: 11,
  },
  actionButton: {
    marginLeft: 12,
  },
  actionButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
