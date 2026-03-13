/**
 * Server Sidebar — Discord-style 240px server sidebar
 *
 * Full server navigation panel containing:
 * - ServerHeader (top, with dropdown menu)
 * - Optional ServerBanner (custom image)
 * - ChannelList (scrollable, categories + channels)
 * - UserBar (bottom: avatar + name + mic/headphone/settings)
 *
 * @module modules/groups/components/server-sidebar
 */

import { motion } from 'motion/react';
import { MicrophoneIcon, SpeakerWaveIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import Tooltip from '@/components/ui/tooltip';
import { ServerHeader } from './server-header';
import { ServerBanner } from './server-banner';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface ServerSidebarProps {
  className?: string;
  /** Server data — replace with store types */
  server?: {
    id: string;
    name: string;
    bannerUrl?: string;
    boostLevel?: number;
  };
}

interface UserBarUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

// ── Status Colors ──────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

// ── User Bar ───────────────────────────────────────────────────────────

function UserBar() {
  // Mock user data — replace with auth store
  const user: UserBarUser = {
    id: 'self',
    displayName: 'User',
    username: 'user#0001',
    status: 'online',
  };

  const isMuted = false;
  const isDeafened = false;

  return (
    <div className="flex items-center gap-2 border-t border-white/[0.06] bg-[#232428] px-2 py-1.5">
      {/* Avatar + Name */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-600">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Status dot */}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-[#232428]',
              statusColors[user.status ?? 'offline']
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user.displayName}</p>
          <p className="truncate text-[10px] text-gray-400">{user.customStatus ?? user.username}</p>
        </div>
      </div>

      {/* Control icons */}
      <div className="flex items-center gap-0.5">
        <Tooltip content={isMuted ? 'Unmute' : 'Mute'} side="top">
          <motion.button whileTap={{ scale: 0.9 }} className="rounded p-1.5 hover:bg-white/[0.08]">
            {isMuted ? (
              <MicOffIcon className="h-4 w-4 text-red-400" />
            ) : (
              <MicrophoneIcon className="h-4 w-4 text-gray-400" />
            )}
          </motion.button>
        </Tooltip>

        <Tooltip content={isDeafened ? 'Undeafen' : 'Deafen'} side="top">
          <motion.button whileTap={{ scale: 0.9 }} className="rounded p-1.5 hover:bg-white/[0.08]">
            <SpeakerWaveIcon
              className={cn('h-4 w-4', isDeafened ? 'text-red-400' : 'text-gray-400')}
            />
          </motion.button>
        </Tooltip>

        <Tooltip content="User Settings" side="top">
          <motion.button whileTap={{ scale: 0.9 }} className="rounded p-1.5 hover:bg-white/[0.08]">
            <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Description. */
/** Server Sidebar component. */
export function ServerSidebar({ className, server }: ServerSidebarProps) {
  const mockServer = server ?? {
    id: '1',
    name: 'CGraph Community',
    boostLevel: 2,
  };

  return (
    <div className={cn('flex h-full w-60 flex-col bg-[#2b2d31]', className)}>
      {/* Server Header */}
      <ServerHeader serverName={mockServer.name} boostLevel={mockServer.boostLevel} />

      {/* Optional Banner */}
      {mockServer.bannerUrl && <ServerBanner imageUrl={mockServer.bannerUrl} />}

      {/* Channel List — scrollable */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Channel list content is rendered by the existing ChannelList component */}
          {/* Integrate with: <ChannelList /> from channel-list/ directory */}
          <div className="px-2 py-1 text-xs text-gray-500">
            {/* Placeholder — replaced by ChannelList integration */}
          </div>
        </div>
      </ScrollArea>

      {/* User Bar (bottom) */}
      <UserBar />
    </div>
  );
}

export default ServerSidebar;
