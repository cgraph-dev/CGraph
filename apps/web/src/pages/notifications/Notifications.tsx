import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { formatTimeAgo } from '@/lib/utils';
import { EmptyState } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  BellIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserGroupIcon,
  AtSymbolIcon,
  ChatBubbleBottomCenterTextIcon,
  Cog6ToothIcon,
  CheckIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Dropdown, { DropdownItem } from '@/components/Dropdown';

const typeIcons: Record<string, typeof BellIcon> = {
  message: ChatBubbleLeftIcon,
  friend_request: UserPlusIcon,
  group_invite: UserGroupIcon,
  mention: AtSymbolIcon,
  forum_reply: ChatBubbleBottomCenterTextIcon,
  system: Cog6ToothIcon,
};

const typeColors: Record<string, string> = {
  message: 'bg-blue-500',
  friend_request: 'bg-green-500',
  group_invite: 'bg-purple-500',
  mention: 'bg-yellow-500',
  forum_reply: 'bg-orange-500',
  system: 'bg-gray-500',
};

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

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="max-w-2xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
              <BellIcon className="h-6 w-6 text-primary-400" />
              Notifications
            </h1>
            <AnimatePresence mode="wait">
              {unreadCount > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-gray-400 mt-1"
                >
                  <motion.span
                    className="inline-block px-2 py-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full text-white text-xs font-medium mr-2"
                    style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {unreadCount}
                  </motion.span>
                  unread notification{unreadCount !== 1 ? 's' : ''}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    markAllAsRead();
                    HapticFeedback.success();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-500/20"
                >
                  <CheckIcon className="h-4 w-4" />
                  Mark all read
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <GlassCard variant="default" className="p-1 mb-6">
          <div className="flex gap-1 relative">
            <motion.button
              onClick={() => {
                setFilter('all');
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all relative z-10"
            >
              {filter === 'all' && (
                <motion.div
                  layoutId="notificationFilterTab"
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-md"
                  style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
              <span className={`relative z-10 ${filter === 'all' ? 'text-white' : 'text-gray-400'}`}>
                All
              </span>
            </motion.button>
            <motion.button
              onClick={() => {
                setFilter('unread');
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all relative z-10"
            >
              {filter === 'unread' && (
                <motion.div
                  layoutId="notificationFilterTab"
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent rounded-md"
                  style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
              <span className={`relative z-10 ${filter === 'unread' ? 'text-white' : 'text-gray-400'}`}>
                Unread{' '}
                <AnimatePresence mode="wait">
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      className="inline-block"
                    >
                      ({unreadCount})
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          </div>
        </GlassCard>

        {/* Notification List */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <motion.div
                      className="relative mb-4"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="p-4 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full">
                        <BellIcon className="h-12 w-12 text-primary-400" />
                      </div>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    </motion.div>
                    <h3 className="text-lg font-medium bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-2">
                      {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                    </h3>
                    <p className="text-gray-400">
                      {filter === 'unread'
                        ? 'You have no unread notifications'
                        : 'When you get notifications, they will appear here'}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05,
                  }}
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

        {/* Load More */}
        <AnimatePresence>
          {hasMore && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mt-6"
            >
              <motion.button
                onClick={() => {
                  loadMore();
                  HapticFeedback.medium();
                }}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Loading...
                  </span>
                ) : (
                  'Load more'
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const Icon = typeIcons[notification.type] || BellIcon;
  const iconColor = typeColors[notification.type] || 'bg-gray-500';

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <GlassCard
        variant={notification.isRead ? 'default' : 'crystal'}
        className={`group relative overflow-hidden cursor-pointer ${
          !notification.isRead ? 'ring-1 ring-primary-500/30' : ''
        }`}
        style={{
          boxShadow: notification.isRead
            ? '0 2px 10px rgba(0, 0, 0, 0.2)'
            : '0 4px 20px rgba(16, 185, 129, 0.15)',
        }}
        onClick={() => {
          onClick();
          HapticFeedback.light();
        }}
      >
        {/* Hover gradient glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />

        <div className="flex items-start gap-4 p-4 relative z-10">
          {/* Icon or Avatar */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {notification.sender?.avatarUrl ? (
              <div className="relative">
                <div className="p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full">
                  <img
                    src={notification.sender.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${iconColor} flex items-center justify-center ring-2 ring-dark-900`}
                  style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}
                >
                  <Icon className="h-3 w-3 text-white" />
                </div>
              </div>
            ) : (
              <div
                className={`h-10 w-10 rounded-full ${iconColor} flex items-center justify-center`}
                style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm ${
                notification.isRead
                  ? 'text-gray-300'
                  : 'bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent font-medium'
              }`}
            >
              {notification.title}
            </p>
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Unread indicator */}
            <AnimatePresence>
              {!notification.isRead && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="mt-2"
                >
                  <motion.div
                    className="h-2 w-2 rounded-full bg-gradient-to-r from-primary-500 to-purple-600"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0.7)',
                        '0 0 0 6px rgba(16, 185, 129, 0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Dropdown
              trigger={
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-gray-400 hover:text-white transition-colors"
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </motion.button>
              }
              align="right"
            >
              {!notification.isRead && (
                <DropdownItem
                  onClick={() => {
                    onMarkAsRead();
                    HapticFeedback.light();
                  }}
                  icon={<CheckIcon className="h-4 w-4" />}
                >
                  Mark as read
                </DropdownItem>
              )}
              <DropdownItem
                onClick={() => {
                  onDelete();
                  HapticFeedback.medium();
                }}
                icon={<TrashIcon className="h-4 w-4" />}
                danger
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
