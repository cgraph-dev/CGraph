import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/api';

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
  message: 'chatbubble-outline',
  friend_request: 'person-add-outline',
  friend_accepted: 'people-outline',
  mention: 'at-outline',
  group_invite: 'people-circle-outline',
  forum_reply: 'chatbubbles-outline',
  system: 'settings-outline',
};

const typeColors: Record<NotificationType, string> = {
  message: '#3b82f6',
  friend_request: '#10b981',
  friend_accepted: '#10b981',
  mention: '#f59e0b',
  group_invite: '#8b5cf6',
  forum_reply: '#06b6d4',
  system: '#6b7280',
};

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

      const response = await api.get<{ data: Notification[]; hasMore: boolean }>('/notifications', {
        params: {
          page: pageNum,
          limit: 20,
          type: activeTab !== 'all' ? activeTab : undefined,
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
      // Show mock data for development
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
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
          } catch (error) {
            console.error('Failed to delete notification:', error);
          }
        },
      },
    ]);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on type
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
    { id: 'all', label: 'All', icon: 'notifications-outline' },
    { id: 'unread', label: 'Unread', icon: 'radio-button-on-outline' },
    { id: 'messages', label: 'Messages', icon: 'chatbubble-outline' },
    { id: 'mentions', label: 'Mentions', icon: 'at-outline' },
    { id: 'system', label: 'System', icon: 'settings-outline' },
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

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.read ? colors.card : isDark ? colors.primary + '15' : colors.primary + '10',
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: typeColors[item.type] + '20' }]}>
        <Ionicons name={typeIcons[item.type]} size={20} color={typeColors[item.type]} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              { color: colors.text, fontWeight: item.read ? '400' : '600' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>

        <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>

        <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (!item.read) {
            handleMarkAsRead(item.id);
          } else {
            handleDelete(item.id);
          }
        }}
      >
        <Ionicons
          name={item.read ? 'trash-outline' : 'checkmark-circle-outline'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {activeTab === 'unread'
          ? "You're all caught up!"
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary + '20' }]}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === item.id && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={activeTab === item.id ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === item.id ? colors.primary : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
              {item.id === 'unread' && unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyList : undefined}
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
      sender: { id: '1', username: 'johndoe' },
      data: { conversationId: '1' },
    },
    {
      id: '2',
      type: 'friend_request',
      title: 'Friend request',
      body: 'Jane Smith wants to be your friend',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: { id: '2', username: 'janesmith' },
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned',
      body: '@you in General: Check out this new feature!',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: { id: '3', username: 'dev_team' },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabs: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
