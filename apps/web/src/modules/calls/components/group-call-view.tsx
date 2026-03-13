/**
 * Group Call View
 *
 * Multi-participant grid view for LiveKit-powered group calls.
 * Supports 2x2, 3x3, and speaker-focused layouts.
 * Active speaker highlighting, control bar integration.
 *
 * @module modules/calls/components/group-call-view
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon, VideoCameraSlashIcon } from '@heroicons/react/24/outline';
import { ConnectionState } from 'livekit-client';
import { LiveKitParticipantTile } from './livekit-participant-tile';
import { EncryptionIndicator } from './encryption-indicator';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import type { UseLiveKitRoomOptions } from '../hooks/useLiveKitRoom';

interface GroupCallViewProps extends UseLiveKitRoomOptions {
  /** Callback when call ends */
  onCallEnd?: () => void;
}

/**
 * Full group call view with participant grid and control bar.
 */
export function GroupCallView({ onCallEnd, ...roomOptions }: GroupCallViewProps) {
  const {
    connectionState,
    participants,
    activeSpeakers,
    isMuted,
    isVideoOn,
    isScreenSharing,
    isE2EEEnabled,
    room,
    connect,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
    error,
  } = useLiveKitRoom(roomOptions);

  // Grid layout based on total participant count (remote + local)
  const totalCount = participants.length + 1;
  const gridClass = useMemo(() => {
    if (totalCount <= 1) return 'grid-cols-1';
    if (totalCount <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalCount <= 4) return 'grid-cols-2';
    if (totalCount <= 6) return 'grid-cols-2 sm:grid-cols-3';
    if (totalCount <= 9) return 'grid-cols-3';
    return 'grid-cols-3 sm:grid-cols-4';
  }, [totalCount]);

  const handleLeave = async () => {
    await leaveRoom();
    onCallEnd?.();
  };

  // Connecting state
  if (connectionState === 'idle') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[rgb(30,32,40)]">
        <h2 className="text-xl font-semibold text-white">Group Call</h2>
        <p className="text-sm text-white/60">Ready to join {roomOptions.roomName}</p>
        <button
          onClick={connect}
          className="rounded-xl bg-primary-500 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-600"
        >
          Join Call
        </button>
      </div>
    );
  }

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[rgb(30,32,40)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-white/60">Connecting...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[rgb(30,32,40)]">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={connect}
          className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white hover:bg-white/[0.10]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[rgb(30,32,40)]">
      {/* Participant Grid */}
      <div className={`grid flex-1 gap-2 p-2 ${gridClass}`}>
        {/* Local participant tile */}
        {room?.localParticipant && (
          <motion.div layout className="min-h-[120px]">
            <LiveKitParticipantTile
              participant={room.localParticipant}
              isLocal
              isSpeaking={activeSpeakers.includes(room.localParticipant.identity)}
            />
          </motion.div>
        )}

        {/* Remote participant tiles */}
        {room &&
          Array.from(room.remoteParticipants.values()).map((p) => (
            <motion.div key={p.sid} layout className="min-h-[120px]">
              <LiveKitParticipantTile
                participant={p}
                isSpeaking={activeSpeakers.includes(p.identity)}
              />
            </motion.div>
          ))}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-3 border-t border-white/5 bg-white/[0.04] p-4">
        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          className={`rounded-full p-3 transition-colors ${
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-white/[0.06] text-white hover:bg-white/[0.10]'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOffIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
        </button>

        {/* Video toggle */}
        <button
          onClick={toggleVideo}
          className={`rounded-full p-3 transition-colors ${
            !isVideoOn
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-white/[0.06] text-white hover:bg-white/[0.10]'
          }`}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? (
            <VideoCameraIcon className="h-5 w-5" />
          ) : (
            <VideoCameraSlashIcon className="h-5 w-5" />
          )}
        </button>

        {/* Screen share toggle */}
        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`rounded-full p-3 transition-colors ${
            isScreenSharing
              ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
              : 'bg-white/[0.06] text-white hover:bg-white/[0.10]'
          }`}
          aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
        >
          <ComputerDesktopIcon className="h-5 w-5" />
        </button>

        {/* Leave call */}
        <button
          onClick={handleLeave}
          className="rounded-full bg-red-500 p-3 text-white transition-colors hover:bg-red-600"
          aria-label="Leave call"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Participant count + Encryption indicator */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <EncryptionIndicator status={isE2EEEnabled ? 'enabled' : 'disabled'} size="sm" />
        <div className="rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white/70">
          {totalCount} participant{totalCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default GroupCallView;
