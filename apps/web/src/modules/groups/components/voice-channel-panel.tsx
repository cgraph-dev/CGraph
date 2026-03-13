/**
 * Voice Channel Panel
 *
 * Persistent overlay at the bottom of the sidebar when connected to a voice channel.
 * Shows current channel name, participant list, and control bar for
 * mute/deafen/video/disconnect.
 *
 * @module modules/groups/components/voice-channel-panel
 */

import { durations } from '@cgraph/animation-constants';
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  SignalIcon,
} from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon } from '@heroicons/react/24/outline';
import { useVoiceStateStore } from '@/stores/voiceStateStore';
import { useVoiceChannel } from '@/modules/calls/hooks/useVoiceChannel';
import { EncryptionIndicator } from '@/modules/calls/components/encryption-indicator';
import { springs } from '@/lib/animation-presets';

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Voice Channel Panel component. */
export function VoiceChannelPanel() {
  const currentChannelId = useVoiceStateStore((s) => s.currentChannelId);
  const members = useVoiceStateStore((s) =>
    s.currentChannelId ? (s.channelMembers[s.currentChannelId] ?? []) : []
  );
  const isMuted = useVoiceStateStore((s) => s.isMuted);
  const isDeafened = useVoiceStateStore((s) => s.isDeafened);
  const isVideoOn = useVoiceStateStore((s) => s.isVideoOn);

  const { toggleMute, toggleDeafen, toggleVideo, leaveChannel } = useVoiceChannel();

  const handleDisconnect = useCallback(() => {
    leaveChannel();
  }, [leaveChannel]);

  return (
    <AnimatePresence>
      {currentChannelId && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={springs.snappy}
          className="border-t border-white/[0.08] bg-white/[0.08] backdrop-blur-sm"
        >
          {/* Channel Info */}
          <div className="flex items-center gap-2 px-3 py-2">
            <SignalIcon className="h-4 w-4 text-green-400" />
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-green-400">Voice Connected</p>
              <p className="truncate text-xs text-gray-400">Channel {currentChannelId}</p>
            </div>
            <EncryptionIndicator status="enabled" size="sm" />
          </div>

          {/* Participant List (max 6 visible) */}
          {members.length > 0 && (
            <div className="max-h-32 overflow-y-auto px-3 pb-1">
              {members.slice(0, 6).map((member) => (
                <div key={member.userId} className="flex items-center gap-2 rounded py-0.5 text-sm">
                  {/* Avatar */}
                  <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName ?? member.userId}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-gray-400">
                        {(member.username ?? member.userId).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className="flex-1 truncate text-xs text-gray-300">
                    {member.displayName ?? member.username ?? member.userId}
                  </span>

                  {/* Speaking indicator */}
                  {member.isSpeaking && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: durations.dramatic.ms / 1000, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-green-400"
                    />
                  )}

                  {/* Mute indicator */}
                  {member.selfMute && <MicOffIcon className="h-3.5 w-3.5 text-red-400" />}

                  {/* Deafen indicator */}
                  {member.selfDeafen && <SpeakerXMarkIcon className="h-3.5 w-3.5 text-red-400" />}
                </div>
              ))}
              {members.length > 6 && (
                <p className="py-0.5 text-xs text-gray-500">+{members.length - 6} more</p>
              )}
            </div>
          )}

          {/* Control Bar */}
          <div className="flex items-center justify-center gap-1 border-t border-white/[0.06] px-3 py-2">
            {/* Mute */}
            <ControlButton
              onClick={toggleMute}
              active={!isMuted}
              danger={isMuted}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOffIcon className="h-4 w-4" />
              ) : (
                <MicrophoneIcon className="h-4 w-4" />
              )}
            </ControlButton>

            {/* Deafen */}
            <ControlButton
              onClick={toggleDeafen}
              active={!isDeafened}
              danger={isDeafened}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? (
                <SpeakerXMarkIcon className="h-4 w-4" />
              ) : (
                <SpeakerWaveIcon className="h-4 w-4" />
              )}
            </ControlButton>

            {/* Video */}
            <ControlButton
              onClick={toggleVideo}
              active={isVideoOn}
              title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              <VideoCameraIcon className="h-4 w-4" />
            </ControlButton>

            {/* Disconnect */}
            <ControlButton onClick={handleDisconnect} danger title="Disconnect">
              <PhoneXMarkIcon className="h-4 w-4" />
            </ControlButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Control Button ────────────────────────────────────────────────────

interface ControlButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  title?: string;
}

function ControlButton({ onClick, children, active, danger, title }: ControlButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        danger
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : active
            ? 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
            : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10] hover:text-gray-200'
      }`}
    >
      {children}
    </motion.button>
  );
}

export default VoiceChannelPanel;
