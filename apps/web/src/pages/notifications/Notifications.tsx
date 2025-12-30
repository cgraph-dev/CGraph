import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/ui';
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
    <div className="flex-1 overflow-hidden">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-dark-800 rounded-lg mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-dark-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-dark-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              title={filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              message={
                filter === 'unread'
                  ? 'You have no unread notifications'
                  : 'When you get notifications, they will appear here'
              }
              icon={<BellIcon className="h-8 w-8 text-gray-500" />}
            />
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
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
    <div
      onClick={onClick}
      className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
        notification.isRead
          ? 'bg-dark-800/50 hover:bg-dark-800'
          : 'bg-dark-800 hover:bg-dark-700'
      }`}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0">
        {notification.sender?.avatarUrl ? (
          <div className="relative">
            <img
              src={notification.sender.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
            <div
              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${iconColor} flex items-center justify-center`}
            >
              <Icon className="h-3 w-3 text-white" />
            </div>
          </div>
        ) : (
          <div className={`h-10 w-10 rounded-full ${iconColor} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={
            <button className="p-1.5 rounded hover:bg-dark-600 text-gray-400 hover:text-white transition-colors">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          }
          align="right"
        >
          {!notification.isRead && (
            <DropdownItem onClick={onMarkAsRead} icon={<CheckIcon className="h-4 w-4" />}>
              Mark as read
            </DropdownItem>
          )}
          <DropdownItem onClick={onDelete} icon={<TrashIcon className="h-4 w-4" />} danger>
            Delete
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="h-2 w-2 rounded-full bg-primary-500" />
        </div>
      )}
    </div>
  );
}
