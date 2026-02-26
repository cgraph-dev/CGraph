/**
 * NotificationsInboxScreen
 *
 * Displays user notifications with swipeable cards, tabs for filtering,
 * and animations for entry/interactions.
 *
 * @refactored Extracted from 1150-line file:
 * - types.ts: Types, constants, mock data
 * - components/SwipeableNotificationItem: Swipeable notification card
 * - components/NotificationTabs: Tab bar filtering
 * - components/NotificationHeader: Animated header
 * - components/EmptyNotifications: Empty state
 * - components/LoadingState: Loading indicator
 */

import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, StatusBar } from 'react-native';
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import type { Notification, TabType, getMockNotifications } from './types';
import {
  SwipeableNotificationItem,
  NotificationTabs,
  NotificationHeader,
  EmptyNotifications,
  LoadingState,
} from './components';

/**
 *
 */
export default function NotificationsInboxScreen() {
  const { colors, isDark } = useThemeStore();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Header animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  // Derived data
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'messages':
        return notifications.filter((n) => n.type === 'message');
      case 'mentions':
        return notifications.filter((n) => n.type === 'mention');
      case 'system':
        return notifications.filter((n) => n.type === 'system');
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setNotifications(getMockNotifications());
      setIsLoading(false);

      // Animate header in
      headerOpacity.value = withTiming(1, { duration: durations.smooth.ms });
      headerTranslateY.value = withSpring(0, { stiffness: 80, damping: 10 });
    };

    loadNotifications();
  }, []);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setNotifications(getMockNotifications());
    setIsRefreshing(false);
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        handleMarkRead(notification.id);
      }
      // Navigation would go here
      // eslint-disable-next-line no-console
      console.log('Navigate to notification:', notification.type, notification.data);
    },
    [handleMarkRead]
  );

  const renderNotification = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <SwipeableNotificationItem
        item={item}
        index={index}
        colors={colors}
        onPress={() => handleNotificationPress(item)}
        onMarkRead={() => handleMarkRead(item.id)}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [colors, handleNotificationPress, handleMarkRead, handleDelete]
  );

  if (isLoading) {
    return <LoadingState colors={colors} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={
          isDark
            ? ['rgba(59,130,246,0.08)', 'rgba(139,92,246,0.05)', 'transparent']
            : ['rgba(59,130,246,0.05)', 'rgba(139,92,246,0.03)', 'transparent']
        }
        style={styles.bgGradient}
      />

      <NotificationHeader
        unreadCount={unreadCount}
        colors={colors}
        headerOpacity={headerOpacity}
        headerTranslateY={headerTranslateY}
        onMarkAllRead={handleMarkAllRead}
      />

      <NotificationTabs
        activeTab={activeTab}
        unreadCount={unreadCount}
        colors={colors}
        onTabChange={setActiveTab}
      />

      {filteredNotifications.length === 0 ? (
        <EmptyNotifications activeTab={activeTab} colors={colors} />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={['#3b82f6']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});
