/**
 * Navigation Sidebar — Discord-style DM sidebar with DMs, Friends, and user area
 *
 * Features:
 * - DMs button with unread count
 * - Friends button with pending count
 * - Private channels section
 * - User area at bottom (avatar, name, status, mic/headphone/settings)
 * - Animated transitions
 *
 * @module shared/components/navigation-sidebar
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserGroupIcon,
  PlusIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon,
  SignalIcon,
} from '@heroicons/react/24/solid';
// ChevronDownIcon removed — unused
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface PrivateChannel {
  id: string;
  name: string;
  avatar?: string;
  isGroup?: boolean;
  memberCount?: number;
  unreadCount?: number;
  isOnline?: boolean;
  lastMessage?: string;
}

interface UserInfo {
  name: string;
  avatar?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

interface NavigationSidebarProps {
  user?: UserInfo;
  privateChannels?: PrivateChannel[];
  unreadDmCount?: number;
  pendingFriendCount?: number;
  onDmsClick?: () => void;
  onFriendsClick?: () => void;
  onChannelClick?: (id: string) => void;
  onNewDm?: () => void;
  onSettingsClick?: () => void;
  activeChannelId?: string;
}

// ── Status Colors ──────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Navigation Sidebar component. */
export function NavigationSidebar({
  user,
  privateChannels = [],
  unreadDmCount: _unreadDmCount = 0,
  pendingFriendCount = 0,
  onDmsClick: _onDmsClick,
  onFriendsClick,
  onChannelClick,
  onNewDm,
  onSettingsClick,
  activeChannelId,
}: NavigationSidebarProps) {
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <div className="flex h-full w-[240px] flex-col bg-[#2b2d31]">
      {/* Header — Search */}
      <button className="flex h-12 items-center border-b border-black/20 px-3 transition-colors hover:bg-white/[0.04]">
        <span className="text-sm text-white/30">Find or start a conversation</span>
      </button>

      {/* Nav items */}
      <div className="space-y-0.5 px-2 pt-2">
        {/* Friends */}
        <NavButton
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Friends"
          badge={pendingFriendCount}
          onClick={onFriendsClick}
        />

        {/* Nitro / Shop (placeholder) */}
        <NavButton icon={<SignalIcon className="h-5 w-5" />} label="Shop" />
      </div>

      {/* Direct Messages header */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Direct Messages
        </span>
        <button onClick={onNewDm} className="text-white/30 transition-colors hover:text-white/60">
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2">
        <AnimatePresence initial={false}>
          {privateChannels.map((ch) => (
            <motion.button
              key={ch.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onClick={() => onChannelClick?.(ch.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors',
                activeChannelId === ch.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {ch.avatar ? (
                  <img src={ch.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold">
                    {ch.isGroup ? (
                      <UserGroupIcon className="h-4 w-4" />
                    ) : (
                      ch.name.charAt(0).toUpperCase()
                    )}
                  </div>
                )}
                {ch.isOnline && !ch.isGroup && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#2b2d31] bg-green-500" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-medium">{ch.name}</span>
                  {ch.isGroup && ch.memberCount && (
                    <span className="text-[10px] text-white/20">{ch.memberCount}</span>
                  )}
                </div>
                {ch.lastMessage && (
                  <p className="truncate text-[11px] text-white/20">{ch.lastMessage}</p>
                )}
              </div>

              {/* Unread badge */}
              {ch.unreadCount != null && ch.unreadCount > 0 && (
                <span className="min-w-[16px] shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                  {ch.unreadCount}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* User area */}
      <div className="flex h-[52px] items-center gap-1 border-t border-black/20 bg-[#232428] px-2">
        {/* Avatar + name */}
        <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-white/[0.04]">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#232428]',
                statusColors[user?.status || 'offline']
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.name || 'User'}</p>
            {user?.customStatus && (
              <p className="truncate text-[10px] text-white/30">{user.customStatus}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <button
          onClick={() => setMuted((m) => !m)}
          className={cn(
            'rounded p-1.5 transition-colors hover:bg-white/[0.08]',
            muted ? 'text-red-400' : 'text-white/40'
          )}
        >
          <MicrophoneIcon className="h-4 w-4" />
          {muted && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-[2px] rotate-45 rounded-full bg-red-400" />
            </div>
          )}
        </button>
        <button
          onClick={() => setDeafened((d) => !d)}
          className={cn(
            'rounded p-1.5 transition-colors hover:bg-white/[0.08]',
            deafened ? 'text-red-400' : 'text-white/40'
          )}
        >
          <SpeakerWaveIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onSettingsClick}
          className="rounded p-1.5 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/60"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── NavButton ──────────────────────────────────────────────────────────

function NavButton({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80"
    >
      {icon}
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      {badge != null && badge > 0 && (
        <span className="min-w-[16px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export default NavigationSidebar;
