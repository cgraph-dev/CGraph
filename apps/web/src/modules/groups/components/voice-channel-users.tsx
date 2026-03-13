/**
 * Voice Channel Users — Connected users below voice channel item
 *
 * Shows user avatars (24px), display names, and mute/deafen indicators.
 * Self is highlighted. Animated enter/exit. Streaming badge for screen share.
 *
 * @module modules/groups/components/voice-channel-users
 */

import { motion, AnimatePresence } from 'motion/react';
import { SpeakerXMarkIcon, VideoCameraIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface VoiceUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
  isStreaming?: boolean;
  isVideoOn?: boolean;
  isSelf?: boolean;
}

interface VoiceChannelUsersProps {
  users: VoiceUser[];
  className?: string;
}

// ── User Row ───────────────────────────────────────────────────────────

function VoiceUserRow({ user }: { user: VoiceUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={springs.snappy}
      className={cn(
        'flex items-center gap-1.5 rounded py-0.5 pl-6 pr-2',
        user.isSelf && 'bg-white/[0.04]'
      )}
    >
      {/* Avatar with speaking ring */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]',
            user.isSpeaking && 'ring-2 ring-green-400 ring-offset-1 ring-offset-transparent'
          )}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[9px] font-bold text-gray-400">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <span
        className={cn(
          'flex-1 truncate text-xs',
          user.isSelf ? 'font-medium text-gray-200' : 'text-gray-400',
          user.isSpeaking && 'text-green-400'
        )}
      >
        {user.displayName}
      </span>

      {/* Status icons */}
      <div className="flex items-center gap-0.5">
        {user.isStreaming && (
          <div className="flex items-center gap-0.5 rounded bg-red-500/20 px-1 py-0.5">
            <ComputerDesktopIcon className="h-2.5 w-2.5 text-red-400" />
            <span className="text-[8px] font-bold text-red-400">LIVE</span>
          </div>
        )}

        {user.isVideoOn && <VideoCameraIcon className="h-3 w-3 text-gray-400" />}

        {user.isMuted && <MicOffIcon className="h-3 w-3 text-red-400" />}

        {user.isDeafened && <SpeakerXMarkIcon className="h-3 w-3 text-red-400" />}
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

/** Description. */
/** Voice Channel Users component. */
export function VoiceChannelUsers({ users, className }: VoiceChannelUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className={cn('ml-3 space-y-0.5', className)}>
      <AnimatePresence>
        {users.map((user) => (
          <VoiceUserRow key={user.id} user={user} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default VoiceChannelUsers;
