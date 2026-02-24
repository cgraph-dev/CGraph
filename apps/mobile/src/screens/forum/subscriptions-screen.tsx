/**
 * Forum subscriptions screen for managing followed forums and threads.
 * @module screens/forum/subscriptions-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { formatDistanceToNow } from 'date-fns';

type NotificationMode = 'instant' | 'daily' | 'weekly' | 'none';
type SubscriptionType = 'forum' | 'board' | 'thread';
type FilterTab = 'all' | SubscriptionType;

interface Subscription {
  id: string;
  type: SubscriptionType;
  targetId: string;
  targetName: string;
  targetPath?: string;
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  unreadCount: number;
  createdAt: Date;
}

export function SubscriptionsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await fetch('/api/forum/subscriptions');
      const data = await response.json() as { subscriptions?: Subscription[] };
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubscriptions();
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetch(`/api/forum/subscriptions/${id}`, {
        method: 'DELETE',
      });
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const getTypeIcon = (type: SubscriptionType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'forum':
        return 'grid-outline';
      case 'board':
        return 'folder-outline';
      case 'thread':
        return 'chatbubble-outline';
    }
  };

  const getModeLabel = (mode: NotificationMode): string => {
    switch (mode) {
      case 'instant':
        return 'Instant';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'none':
        return 'Muted';
    }
  };

  const filteredSubscriptions =
    activeTab === 'all'
      ? subscriptions
      : subscriptions.filter((sub) => sub.type === activeTab);

  const counts = {
    all: subscriptions.length,
    forum: subscriptions.filter((s) => s.type === 'forum').length,
    board: subscriptions.filter((s) => s.type === 'board').length,
    thread: subscriptions.filter((s) => s.type === 'thread').length,
  };

  const totalUnread = subscriptions.reduce((acc, sub) => acc + sub.unreadCount, 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    unreadBadge: {
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    unreadBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    tabsContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: colors.primary + '20',
    },
    tabText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    tabCount: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    listContent: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    subscriptionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemName: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    itemUnread: {
      backgroundColor: colors.error,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    itemUnreadText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    itemPath: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    itemMode: {
      fontSize: 11,
      color: colors.primary,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },
    itemDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    deleteButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderSubscription = ({ item }: { item: Subscription }) => (
    <View style={styles.subscriptionItem}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getTypeIcon(item.type)}
          size={20}
          color={colors.primary}
        />
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.targetName}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.itemUnread}>
              <Text style={styles.itemUnreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        {item.targetPath && (
          <Text style={styles.itemPath} numberOfLines={1}>
            {item.targetPath}
          </Text>
        )}
        
        <View style={styles.itemMeta}>
          <Text style={styles.itemMode}>{getModeLabel(item.notificationMode)}</Text>
          <Text style={styles.itemDate}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No subscriptions yet</Text>
      <Text style={styles.emptyText}>
        Subscribe to forums, boards, or threads to get notified of new activity
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <Text style={styles.headerSubtitle}>
            {subscriptions.length} subscriptions
          </Text>
        </View>
        {totalUnread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{totalUnread} unread</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'forum', 'board', 'thread'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            <Text style={styles.tabCount}>({counts[tab]})</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscription}
        contentContainerStyle={
          filteredSubscriptions.length === 0
            ? { flex: 1 }
            : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

export default SubscriptionsScreen;
