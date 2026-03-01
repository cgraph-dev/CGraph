/**
 * LiveKit Participant Tile
 *
 * Renders a single participant's video/audio in a LiveKit group call.
 * Handles video track attachment, speaking indicators, and fallback avatar.
 *
 * @module modules/calls/components/livekit-participant-tile
 * @version 1.0.0
 */

import { useRef, useEffect } from 'react';
import {
  Track,
  type RemoteTrackPublication,
  type RemoteParticipant,
  type LocalParticipant,
} from 'livekit-client';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import {
  VideoCameraSlashIcon,
  SignalIcon,
} from '@heroicons/react/24/solid';

interface LiveKitParticipantTileProps {
  /** The LiveKit participant (remote or local) */
  participant: RemoteParticipant | LocalParticipant;
  /** Whether this is the local user */
  isLocal?: boolean;
  /** Whether this participant is currently speaking */
  isSpeaking?: boolean;
  /** Optional display name override */
  displayName?: string;
}

/**
 * Single participant video tile for LiveKit group calls.
 */
export function LiveKitParticipantTile({
  participant,
  isLocal = false,
  isSpeaking = false,
  displayName,
}: LiveKitParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const name = displayName || participant.name || participant.identity;
  const isMuted = !participant.isMicrophoneEnabled;
  const isVideoEnabled = participant.isCameraEnabled;

  // Attach video track
  useEffect(() => {
    if (!videoRef.current) return;

    const publication = participant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track;

    if (track && isVideoEnabled) {
      track.attach(videoRef.current);
    }

    return () => {
      if (track) {
        track.detach(videoRef.current!);
      }
    };
  }, [participant, isVideoEnabled]);

  // Attach audio track (only for remote participants)
  useEffect(() => {
    if (isLocal || !audioRef.current) return;

    const publication = participant.getTrackPublication(
      Track.Source.Microphone
    );
    const track = publication?.track;

    if (track) {
      track.attach(audioRef.current);
    }

    return () => {
      if (track) {
        track.detach(audioRef.current!);
      }
    };
  }, [participant, isLocal]);

  // Connection quality color
  const qualityColor = (() => {
    switch (participant.connectionQuality) {
      case 3:
        return 'text-green-400';
      case 2:
        return 'text-yellow-400';
      case 1:
        return 'text-red-400';
      default:
        return 'text-white/30';
    }
  })();

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-dark-800 ${
        isSpeaking ? 'ring-2 ring-primary-500' : 'ring-1 ring-white/10'
      }`}
    >
      {/* Video element */}
      {isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
          style={isLocal ? { transform: 'scaleX(-1)' } : undefined}
        />
      ) : (
        /* Avatar fallback */
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-700 to-dark-900">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-3xl font-bold text-white">
            {(name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Hidden audio element for remote participants */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Name + mute indicator */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1">
        {isMuted && (
          <MicrophoneIcon className="h-3.5 w-3.5 text-red-400" />
        )}
        <span className="text-xs font-medium text-white">
          {isLocal ? 'You' : name}
        </span>
      </div>

      {/* Connection quality indicator */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {!isVideoEnabled && (
          <VideoCameraSlashIcon className="h-4 w-4 text-white/40" />
        )}
        <SignalIcon className={`h-3.5 w-3.5 ${qualityColor}`} />
      </div>
    </div>
  );
}

export default LiveKitParticipantTile;
