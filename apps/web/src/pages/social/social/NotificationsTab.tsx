/**
 * NotificationsTab Component
 * Notifications list with mark as read functionality
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { getNotificationIcon, formatTimeAgo } from './utils';
import type { NotificationsTabProps } from './types';

export function NotificationsTab({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsTabProps) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up!'}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <GlassCard variant="frosted" className="p-8 text-center">
          <BellIconSolid className="mx-auto mb-3 h-12 w-12 text-white/40" />
          <p className="text-white/60">No notifications yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <GlassCard
                variant={notification.read ? 'frosted' : 'neon'}
                glow={!notification.read}
                className={`cursor-pointer p-4 transition-transform hover:scale-[1.01] ${
                  notification.read ? 'opacity-60' : ''
                }`}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-3xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-start justify-between">
                      <h4 className="font-medium text-white">{notification.title}</h4>
                      <span className="ml-2 flex-shrink-0 text-xs text-white/60">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">{notification.message}</p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
