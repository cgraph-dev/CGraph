/**
 * Notification Item
 *
 * Individual notification card with avatar, content, and actions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, TrashIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { formatTimeAgo } from '@/lib/utils';
import Dropdown, { DropdownItem } from '@/components/navigation/dropdown';
import { NotificationActions } from '@/shared/components/notification-actions';
import { TYPE_ICONS, TYPE_COLORS, DEFAULT_ICON, DEFAULT_COLOR } from './constants';
import type { NotificationItemProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * unknown for the notifications module.
 */
/**
 * Notification Item component.
 */
export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type] || DEFAULT_ICON;
  const iconColor = TYPE_COLORS[notification.type] || DEFAULT_COLOR;

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <GlassCard
        variant={notification.isRead ? 'default' : 'crystal'}
        className={`group relative cursor-pointer overflow-hidden ${
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100"
          transition={tweens.standard}
        />

        <div className="relative z-10 flex items-start gap-4 p-4">
          {/* Icon or Avatar */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.bouncy}
          >
            {notification.sender?.avatarUrl ? (
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-0.5">
                  <ThemedAvatar
                    src={notification.sender.avatarUrl}
                    alt={notification.sender.displayName || notification.sender.username}
                    size="small"
                    className="h-10 w-10"
                    avatarBorderId={
                      notification.sender.avatarBorderId ??
                      notification.sender.avatar_border_id ??
                      null
                    }
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
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm ${
                notification.isRead
                  ? 'text-gray-300'
                  : 'bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent'
              }`}
            >
              {notification.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-400">{notification.body}</p>
            <p className="mt-1 text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</p>

            {/* Inline action buttons for actionable notifications */}
            {/* type assertion: narrowing notification.type to known union after includes() check */}
            {(['friend_request', 'message', 'group_invite', 'mention'] as const).includes(
               
              notification.type as 'friend_request' | 'message' | 'group_invite' | 'mention' // type assertion: narrowing notification.type to known union after includes() check
            ) && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <NotificationActions
                  type={
                     
                    notification.type as 'friend_request' | 'message' | 'group_invite' | 'mention' // type assertion: narrowing notification.type to known union after includes() check
                  }
                  notificationId={notification.id}
                  sourceId={
                    typeof notification.data?.sourceId === 'string' ? notification.data.sourceId : (notification.sender?.id ?? '')
                  }
                  onAction={() => onMarkAsRead()}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex flex-shrink-0 items-start gap-2"
            onClick={(e) => e.stopPropagation()}
          >
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
                    transition={loop(tweens.ambient)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Dropdown
              trigger={
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg bg-dark-700/50 p-1.5 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
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
