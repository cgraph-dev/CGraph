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
    <div className="w-[240px] h-full bg-[#2b2d31] flex flex-col">
      {/* Header — Search */}
      <button className="h-12 px-3 flex items-center border-b border-black/20 hover:bg-white/[0.04] transition-colors">
        <span className="text-sm text-white/30">Find or start a conversation</span>
      </button>

      {/* Nav items */}
      <div className="px-2 pt-2 space-y-0.5">
        {/* Friends */}
        <NavButton
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Friends"
          badge={pendingFriendCount}
          onClick={onFriendsClick}
        />

        {/* Nitro / Shop (placeholder) */}
        <NavButton
          icon={<SignalIcon className="h-5 w-5" />}
          label="Shop"
        />
      </div>

      {/* Direct Messages header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">
          Direct Messages
        </span>
        <button
          onClick={onNewDm}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
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
                'w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors group',
                activeChannelId === ch.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60',
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {ch.avatar ? (
                  <img src={ch.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold">
                    {ch.isGroup ? (
                      <UserGroupIcon className="h-4 w-4" />
                    ) : (
                      ch.name.charAt(0).toUpperCase()
                    )}
                  </div>
                )}
                {ch.isOnline && !ch.isGroup && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#2b2d31]" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{ch.name}</span>
                  {ch.isGroup && ch.memberCount && (
                    <span className="text-[10px] text-white/20">{ch.memberCount}</span>
                  )}
                </div>
                {ch.lastMessage && (
                  <p className="text-[11px] text-white/20 truncate">{ch.lastMessage}</p>
                )}
              </div>

              {/* Unread badge */}
              {ch.unreadCount != null && ch.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shrink-0">
                  {ch.unreadCount}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* User area */}
      <div className="h-[52px] px-2 flex items-center gap-1 bg-[#232428] border-t border-black/20">
        {/* Avatar + name */}
        <div className="flex items-center gap-2 flex-1 min-w-0 px-1 py-1 rounded hover:bg-white/[0.04] cursor-pointer">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#232428]',
                statusColors[user?.status || 'offline'],
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name || 'User'}</p>
            {user?.customStatus && (
              <p className="text-[10px] text-white/30 truncate">{user.customStatus}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <button
          onClick={() => setMuted((m) => !m)}
          className={cn(
            'p-1.5 rounded hover:bg-white/[0.08] transition-colors',
            muted ? 'text-red-400' : 'text-white/40',
          )}
        >
          <MicrophoneIcon className="h-4 w-4" />
          {muted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[2px] h-5 bg-red-400 rotate-45 rounded-full" />
            </div>
          )}
        </button>
        <button
          onClick={() => setDeafened((d) => !d)}
          className={cn(
            'p-1.5 rounded hover:bg-white/[0.08] transition-colors',
            deafened ? 'text-red-400' : 'text-white/40',
          )}
        >
          <SpeakerWaveIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onSettingsClick}
          className="p-1.5 rounded text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-colors"
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
      className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-colors"
    >
      {icon}
      <span className="text-sm font-medium flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

export default NavigationSidebar;
