/**
 * VideoGrid - Arranges multiple video tiles in a responsive grid
 * For group/multi-participant video calls
 */

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import type { CallParticipant } from '@/modules/calls/types';

interface VideoTileProps {
  stream: MediaStream | null;
  participant: CallParticipant;
  isLocal?: boolean;
  isSpeaking?: boolean;
}

function VideoTile({ stream, participant, isLocal = false, isSpeaking = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-dark-800 ${
        isSpeaking ? 'ring-2 ring-primary-500' : 'ring-1 ring-white/10'
      }`}
    >
      {stream && participant.isVideoEnabled !== false ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
          style={isLocal ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-700 to-dark-900">
          {participant.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={participant.username}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-3xl font-bold text-white">
              {(participant.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1">
        {participant.isMuted && (
          <MicrophoneIcon className="h-3.5 w-3.5 text-red-400" />
        )}
        <span className="text-xs font-medium text-white">
          {isLocal ? 'You' : participant.username}
        </span>
      </div>

      {/* Not video indicator */}
      {participant.isVideoEnabled === false && (
        <div className="absolute right-2 top-2">
          <VideoCameraSlashIcon className="h-4 w-4 text-white/40" />
        </div>
      )}
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: CallParticipant[];
  localUser?: { userId: string; username: string; avatarUrl?: string };
  isVideoEnabled: boolean;
  isMuted: boolean;
}

export function VideoGrid({
  localStream,
  remoteStreams,
  participants,
  localUser,
  isVideoEnabled,
  isMuted,
}: VideoGridProps) {
  const totalParticipants = participants.length + 1; // +1 for local

  // Grid layout based on participant count
  const gridClass =
    totalParticipants <= 1
      ? 'grid-cols-1'
      : totalParticipants <= 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : totalParticipants <= 4
          ? 'grid-cols-2'
          : totalParticipants <= 6
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-3 sm:grid-cols-4';

  return (
    <div className={`grid h-full w-full gap-2 p-2 ${gridClass}`}>
      {/* Local tile */}
      <motion.div layout className="min-h-[120px]">
        <VideoTile
          stream={localStream}
          participant={{
            id: localUser?.userId || 'local',
            username: localUser?.username || 'You',
            displayName: localUser?.username || 'You',
            avatarUrl: localUser?.avatarUrl ?? null,
            isMuted,
            isVideoEnabled,
            isSpeaking: false,
            isScreenSharing: false,
            connectionQuality: 'excellent',
            joinedAt: new Date().toISOString(),
          }}
          isLocal
        />
      </motion.div>

      {/* Remote tiles */}
      {participants.map((p) => (
        <motion.div key={p.id} layout className="min-h-[120px]">
          <VideoTile
            stream={remoteStreams.get(p.id) || null}
            participant={p}
            isSpeaking={p.isSpeaking}
          />
        </motion.div>
      ))}
    </div>
  );
}
