/**
 * NotificationsTab Component
 * Notifications list with mark as read functionality
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { getNotificationIcon, formatTimeAgo } from './utils';
import type { NotificationsTabProps } from './types';

/**
 * unknown for the social module.
 */
/**
 * Notifications Tab component.
 */
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
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up!'}
          <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="rounded-xl bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-400 ring-1 ring-primary-500/20 transition-all hover:bg-primary-500/20"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <GlassCard variant="frosted" className="relative overflow-hidden p-12 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/[0.06] blur-[60px]" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-primary-500/10 ring-1 ring-white/[0.06]">
              <BellIconSolid className="h-10 w-10 text-purple-400/60" />
            </div>
            <h4 className="mb-2 text-lg font-semibold text-white/80">No notifications yet</h4>
            <p className="mx-auto max-w-sm text-sm text-white/40">
              When someone interacts with you, notifications will show up here.
            </p>
          </div>
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
