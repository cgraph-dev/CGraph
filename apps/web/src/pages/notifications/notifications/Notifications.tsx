/**
 * Notifications Page
 *
 * Main notifications page component with filtering and list display.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, type Notification } from '@/modules/social/store';
import { motion, AnimatePresence } from 'framer-motion';
import { AmbientParticles } from './AmbientParticles';
import { NotificationHeader } from './NotificationHeader';
import { NotificationFilterTabs } from './NotificationFilterTabs';
import { NotificationItem } from './NotificationItem';
import { EmptyState } from './EmptyState';
import { LoadMoreButton } from './LoadMoreButton';
import type { NotificationFilter } from './types';
import { springs } from '@/lib/animation-presets/presets';

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [filter, setFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.data.conversation_id) {
          navigate(`/messages/${notification.data.conversation_id}`);
        }
        break;
      case 'friend_request':
        navigate('/friends');
        break;
      case 'group_invite':
        if (notification.data.group_id) {
          navigate(`/groups/${notification.data.group_id}`);
        }
        break;
      case 'mention':
      case 'forum_reply':
        if (notification.data.post_id && notification.data.forum_slug) {
          navigate(`/forums/${notification.data.forum_slug}/post/${notification.data.post_id}`);
        }
        break;
    }
  };

  const loadMore = () => {
    const currentPage = Math.ceil(notifications.length / 20) + 1;
    fetchNotifications(currentPage);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles count={8} />

      <div className="relative z-10 mx-auto max-w-2xl p-6">
        <NotificationHeader unreadCount={unreadCount} onMarkAllRead={markAllAsRead} />

        <NotificationFilterTabs
          filter={filter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
        />

        {/* Notification List */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={springs.bouncy}
                >
                  <NotificationItem
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {notifications.length > 0 && (
          <LoadMoreButton hasMore={hasMore} isLoading={isLoading} onLoadMore={loadMore} />
        )}
      </div>
    </div>
  );
}

export { Notifications };
