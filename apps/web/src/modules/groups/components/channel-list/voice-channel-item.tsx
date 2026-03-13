/**
 * Voice Channel Item
 *
 * Renders a voice channel in the channel list with live occupancy display.
 * Shows connected user avatars, mute indicators, and join-on-click behavior.
 *
 * @module modules/groups/components/channel-list/voice-channel-item
 */

import { useCallback } from 'react';
import { motion } from 'motion/react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useVoiceStateStore, type VoiceMember } from '@/stores/voiceStateStore';
import { useVoiceChannel } from '@/modules/calls/hooks/useVoiceChannel';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { springs } from '@/lib/animation-presets';
import type { Channel } from '@/modules/groups/store';

// ── Types ──────────────────────────────────────────────────────────────

interface VoiceChannelItemProps {
  /** Channel data */
  channel: Channel;
  /** Group ID for join context */
  groupId: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const MAX_VISIBLE_AVATARS = 5;

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Voice Channel Item component. */
export function VoiceChannelItem({ channel, groupId }: VoiceChannelItemProps) {
  const { joinChannel } = useVoiceChannel();
  const currentChannelId = useVoiceStateStore((s) => s.currentChannelId);
  const members = useVoiceStateStore((s) => s.channelMembers[channel.id] ?? []);
  const isConnected = currentChannelId === channel.id;

  const handleClick = useCallback(() => {
    HapticFeedback.light();
    if (!isConnected) {
      joinChannel(channel.id, groupId);
    }
  }, [isConnected, joinChannel, channel.id, groupId]);

  const overflow = Math.max(0, members.length - MAX_VISIBLE_AVATARS);
  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex w-full flex-col gap-1 rounded-lg px-2 py-1.5 text-left transition-colors ${
        isConnected ? 'text-white' : 'text-gray-400 hover:bg-white/[0.08] hover:text-gray-200'
      }`}
    >
      {/* Active indicator */}
      {isConnected && (
        <motion.div
          layoutId="activeVoiceIndicator"
          className="absolute inset-0 rounded-lg bg-green-600/20"
          transition={springs.snappy}
        />
      )}

      {/* Channel name row */}
      <div className="flex items-center gap-2">
        <SpeakerWaveIcon
          className={`h-5 w-5 flex-shrink-0 ${
            isConnected ? 'text-green-400' : 'text-green-400/70'
          }`}
        />
        <span className="flex-1 truncate text-sm font-medium">{channel.name}</span>

        {/* Connected badge */}
        {isConnected && (
          <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
            Connected
          </span>
        )}
      </div>

      {/* Connected members */}
      {members.length > 0 && (
        <div className="ml-7 flex items-center gap-1">
          {visibleMembers.map((member) => (
            <MemberAvatar key={member.userId} member={member} />
          ))}
          {overflow > 0 && <span className="ml-1 text-xs text-gray-500">+{overflow}</span>}
        </div>
      )}
    </motion.button>
  );
}

// ── Member Avatar ──────────────────────────────────────────────────────

function MemberAvatar({ member }: { member: VoiceMember }) {
  return (
    <div className="group relative">
      <div
        className={`h-6 w-6 overflow-hidden rounded-full bg-white/[0.08] ring-2 ${
          member.selfMute ? 'ring-red-500/40' : 'ring-[rgb(30,32,40)]'
        }`}
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.displayName ?? member.username ?? member.userId}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400">
            {(member.username ?? member.userId).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Mute indicator */}
      {member.selfMute && (
        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-[rgb(30,32,40)]">
          <svg viewBox="0 0 10 10" className="h-full w-full text-white">
            <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-[rgb(30,32,40)] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {member.displayName ?? member.username ?? member.userId}
        {member.selfMute && ' (Muted)'}
        {member.selfDeafen && ' (Deafened)'}
      </div>
    </div>
  );
}

export default VoiceChannelItem;
