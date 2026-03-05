/**
 * Notification Item — Individual notification with type icons and rich text
 *
 * Types: mention, reaction, friend_request, follow, reply, like, thread_update, system
 *
 * @module shared/components/notification-item
 */

import React from 'react';
import {
  AtSymbolIcon,
  FaceSmileIcon,
  UserPlusIcon,
  ArrowUturnLeftIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

export type NotificationType =
  | 'mention'
  | 'reaction'
  | 'friend_request'
  | 'follow'
  | 'reply'
  | 'like'
  | 'thread_update'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  actorName: string;
  actorAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  channelName?: string;
  emoji?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onDismiss?: () => void;
}

// ── Type Config ────────────────────────────────────────────────────────

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  mention: { icon: <AtSymbolIcon className="h-3.5 w-3.5" />, color: 'text-blue-400' },
  reaction: { icon: <FaceSmileIcon className="h-3.5 w-3.5" />, color: 'text-yellow-400' },
  friend_request: { icon: <UserPlusIcon className="h-3.5 w-3.5" />, color: 'text-green-400' },
  follow: { icon: <UserPlusIcon className="h-3.5 w-3.5" />, color: 'text-green-400' },
  reply: { icon: <ArrowUturnLeftIcon className="h-3.5 w-3.5" />, color: 'text-primary-400' },
  like: { icon: <HeartIcon className="h-3.5 w-3.5" />, color: 'text-red-400' },
  thread_update: { icon: <ChatBubbleLeftIcon className="h-3.5 w-3.5" />, color: 'text-purple-400' },
  system: { icon: <BellIcon className="h-3.5 w-3.5" />, color: 'text-white/40' },
};

// ── Relative Time ──────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// ── Component ──────────────────────────────────────────────────────────

export function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const n = notification;
  const conf = typeConfig[n.type];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors group relative',
        'hover:bg-white/[0.04]',
        !n.read && 'border-l-2 border-l-primary-500',
      )}
    >
      {/* Actor avatar */}
      {n.actorAvatar ? (
        <div className="relative shrink-0">
          <img
            src={n.actorAvatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#1e1f22] flex items-center justify-center',
              conf.color,
            )}
          >
            {conf.icon}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0',
            conf.color,
          )}
        >
          {conf.icon}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/70 leading-snug">
          <span className="font-semibold text-white/90">{n.actorName}</span>{' '}
          {n.content}
          {n.emoji && <span className="ml-1">{n.emoji}</span>}
          {n.channelName && (
            <span className="text-white/30"> in <span className="text-white/40">#{n.channelName}</span></span>
          )}
        </p>
        <p className="text-[10px] text-white/20 mt-0.5">{relativeTime(n.timestamp)}</p>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-white/40 transition-opacity shrink-0"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Unread dot (for items without border) */}
      {!n.read && (
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary-500" />
      )}
    </button>
  );
}

export default NotificationItem;
