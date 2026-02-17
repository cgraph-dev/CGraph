/**
 * Social Component
 * Main orchestrator for the Social Hub
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFriendStore } from '@/modules/social/store';
import { useNotificationStore } from '@/modules/social/store';
import { useSearchStore } from '@/modules/search/store';
import { FriendsTab } from './FriendsTab';
import { NotificationsTab } from './NotificationsTab';
import { DiscoverTab } from './DiscoverTab';
import type { SocialTab, Notification, SearchResult } from './types';

/**
 * Social Hub - Unified Social Interface
 *
 * Consolidates 3 major social features into one tab:
 * 1. Friends - Friend list, requests, online status
 * 2. Notifications - All app notifications in one place
 * 3. Discover - Global search for users, forums, groups
 *
 * This replaces the old /friends, /notifications, and /search routes.
 */
export function Social() {
  const { tab = 'friends' } = useParams<{ tab: SocialTab }>();
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    acceptRequest,
    declineRequest,
    clearError,
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Wire real notification store
  const {
    notifications: storeNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
  } = useNotificationStore();

  // Wire real search store
  const {
    users: searchUsers,
    groups: searchGroups,
    forums: searchForums,
    isLoading: _isSearching,
    search: performSearch,
    setQuery: setSearchStoreQuery,
  } = useSearchStore();

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchNotifications();
  }, [fetchFriends, fetchPendingRequests, fetchNotifications]);

  // Adapt store notifications → UI Notification type
  const notifications: Notification[] = useMemo(
    () =>
      storeNotifications.map((n) => ({
        id: n.id,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.body,
        timestamp: new Date(n.createdAt),
        read: n.isRead,
        avatarUrl: n.sender?.avatarUrl ?? undefined,
      })),
    [storeNotifications]
  );

  // Adapt store search results → UI SearchResult type
  const searchResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];
    for (const user of searchUsers) {
      results.push({
        id: user.id,
        type: 'user',
        name: user.displayName || user.username,
        description: `@${user.username}`,
        avatarUrl: user.avatarUrl ?? undefined,
      });
    }
    for (const group of searchGroups) {
      results.push({
        id: group.id,
        type: 'group',
        name: group.name,
        description: group.description || '',
        memberCount: group.memberCount,
      });
    }
    for (const forum of searchForums) {
      results.push({
        id: forum.id,
        type: 'forum',
        name: forum.name,
        description: forum.description || '',
        memberCount: forum.postCount,
      });
    }
    return results;
  }, [searchUsers, searchGroups, searchForums]);

  // Filter friends by search
  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search via real search store
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setSearchStoreQuery(query);
      if (query.length >= 2) {
        performSearch(query);
      }
    },
    [setSearchStoreQuery, performSearch]
  );

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markNotificationRead(notificationId);
    },
    [markNotificationRead]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const tabs = [
    { id: 'friends' as SocialTab, label: 'Friends', icon: UsersIcon, count: friends.length },
    {
      id: 'notifications' as SocialTab,
      label: 'Notifications',
      icon: BellIcon,
      count: unreadCount,
    },
    { id: 'discover' as SocialTab, label: 'Discover', icon: MagnifyingGlassIcon, count: 0 },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-white/10 bg-dark-900/80 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Social Hub</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => navigate(`/social/${tabItem.id}`)}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tabItem.label}
                  {tabItem.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
                    >
                      {tabItem.count > 99 ? '99+' : tabItem.count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {tab === 'friends' && (
              <FriendsTab
                friends={filteredFriends}
                pendingRequests={pendingRequests}
                sentRequests={sentRequests}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAcceptRequest={acceptRequest}
                onDeclineRequest={declineRequest}
                isLoading={isLoading}
                error={error}
                onRetry={() => {
                  clearError();
                  fetchFriends();
                  fetchPendingRequests();
                }}
              />
            )}

            {tab === 'notifications' && (
              <NotificationsTab
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            )}

            {tab === 'discover' && (
              <DiscoverTab
                searchQuery={searchQuery}
                searchResults={searchResults}
                onSearchChange={handleSearch}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
