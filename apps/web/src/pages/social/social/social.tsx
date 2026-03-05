/**
 * Social Component
 * Main orchestrator for the Social Hub
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UsersIcon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useFriendStore } from '@/modules/social/store';
import { useNotificationStore } from '@/modules/social/store';
import { useSearchStore } from '@/modules/search/store';
import { FriendsTab } from './friends-tab';
import { NotificationsTab } from './notifications-tab';
import { DiscoverTab } from './discover-tab';
import { ContactsPresenceList } from '@/modules/social/components/contacts-presence-list';
import type { SocialTab, Notification, SearchResult } from './types';
import { tweens } from '@/lib/animation-presets';

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
    fetchSentRequests,
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
    fetchSentRequests();
    fetchNotifications();
  }, [fetchFriends, fetchPendingRequests, fetchSentRequests, fetchNotifications]);

  // Adapt store notifications → UI Notification type
  const notifications: Notification[] = useMemo(
    () =>
      storeNotifications.map((n) => ({
        id: n.id,

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- safe: store type matches UI union
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

  const tabs: { id: SocialTab; label: string; icon: typeof UsersIcon; count: number }[] = [
    { id: 'friends', label: 'Friends', icon: UsersIcon, count: friends.length },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      count: unreadCount,
    },
    { id: 'discover', label: 'Discover', icon: MagnifyingGlassIcon, count: 0 },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background mesh gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/[0.04] blur-[120px]" />
      </div>

      {/* Floating ambient particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.08, 0.25, 0.08],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Header with Tabs */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/[0.06] bg-[rgb(30,32,40)]/60 backdrop-blur-2xl">
        {/* Top edge glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

        <div className="px-6 py-5">
          <div className="mb-5 flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent"
            >
              Social Hub
            </motion.h1>
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
                  className={`group relative flex items-center gap-2.5 rounded-xl px-5 py-2.5 font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-lg shadow-primary-500/20'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {/* Active tab background */}
                  {isActive && (
                    <motion.div
                      layoutId="socialActiveTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/90 to-primary-500/70 shadow-lg shadow-primary-500/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Hover background for inactive */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-white/[0.04] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  )}
                  <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
                  <span className="relative z-10">{tabItem.label}</span>
                  {tabItem.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative z-10 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-md shadow-red-500/30"
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
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="flex gap-6 p-6">
          {/* Main content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={tweens.standard}
              className={tab === 'friends' ? 'flex-1' : 'w-full'}
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

          {/* Online contacts sidebar — visible on friends tab */}
          {tab === 'friends' && (
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgb(30,32,40)]/40 shadow-xl shadow-black/20 backdrop-blur-xl">
                {/* Sidebar accent glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
                <ContactsPresenceList
                  className="max-h-[calc(100vh-12rem)] overflow-y-auto"
                  onContactClick={(friend) => navigate(`/messages?user=${friend.id}`)}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
