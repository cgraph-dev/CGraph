/**
 * Notification Center — Slide-out panel with grouped, time-bucketed notifications
 *
 * Features:
 * - Tabs: All, Mentions, Reactions, Follows
 * - Time grouping: Today, Yesterday, This Week, Older
 * - Mark all as read
 * - Unread left border highlight
 * - Animated slide-in from right
 *
 * @module shared/components/notification-center
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellIcon,
  AtSymbolIcon,
  FaceSmileIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { NotificationItem, type Notification } from './notification-item';

// ── Types ──────────────────────────────────────────────────────────────

type NotificationTab = 'all' | 'mentions' | 'reactions' | 'follows';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (n: Notification) => void;
  onDismiss?: (id: string) => void;
}

// ── Tab Config ─────────────────────────────────────────────────────────

const tabs: { value: NotificationTab; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <BellIcon className="h-4 w-4" /> },
  { value: 'mentions', label: 'Mentions', icon: <AtSymbolIcon className="h-4 w-4" /> },
  { value: 'reactions', label: 'Reactions', icon: <FaceSmileIcon className="h-4 w-4" /> },
  { value: 'follows', label: 'Follows', icon: <UserPlusIcon className="h-4 w-4" /> },
];

// ── Time Bucketing ─────────────────────────────────────────────────────

function getTimeBucket(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  return 'Older';
}

const bucketOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

// ── Component ──────────────────────────────────────────────────────────

export function NotificationCenter({
  open,
  onClose,
  notifications = [],
  onMarkAllRead,
  onNotificationClick,
  onDismiss,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    const typeMap: Record<NotificationTab, string[]> = {
      all: [],
      mentions: ['mention'],
      reactions: ['reaction'],
      follows: ['friend_request', 'follow'],
    };
    const types = typeMap[activeTab];
    return notifications.filter((n) => types.includes(n.type));
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of filteredNotifications) {
      const bucket = getTimeBucket(n.timestamp);
      const existing = map.get(bucket) || [];
      existing.push(n);
      map.set(bucket, existing);
    }
    return map;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9997] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/30" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-[400px] h-full bg-[#1e1f22] border-l border-white/[0.06] flex flex-col"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="p-1.5 rounded-md text-white/40 hover:text-white/60 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md text-white/40 hover:text-white/60 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      activeTab === tab.value
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex-1 overflow-y-auto py-2">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <InboxIcon className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No notifications to show</p>
                </div>
              ) : (
                bucketOrder.map((bucket) => {
                  const items = grouped.get(bucket);
                  if (!items?.length) return null;
                  return (
                    <div key={bucket} className="mb-2">
                      <p className="px-4 py-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                        {bucket}
                      </p>
                      {items.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onClick={() => onNotificationClick?.(n)}
                          onDismiss={() => onDismiss?.(n.id)}
                        />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NotificationCenter;
