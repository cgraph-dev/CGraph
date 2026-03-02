/**
 * useLiveKitRoom Hook
 *
 * React hook for managing LiveKit room connections in group calls.
 * Handles token fetching, room connection, participant tracking,
 * and media controls.
 *
 * @module modules/calls/hooks/useLiveKitRoom
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  type RemoteParticipant,
} from 'livekit-client';
import { LiveKitService } from '@/lib/webrtc/livekitService';
import type { LiveKitParticipant } from '@/lib/webrtc/livekitService';
import { decodeRoomKey } from '@/lib/webrtc/callEncryption';
import { api as apiClient } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseLiveKitRoomOptions {
  /** Room name to join */
  roomName: string;
  /** Optional channel ID for group authorization */
  channelId?: string;
  /** Optional group ID for membership check */
  groupId?: string;
  /** Start with audio enabled */
  audioEnabled?: boolean;
  /** Start with video enabled */
  videoEnabled?: boolean;
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

export interface UseLiveKitRoomReturn {
  /** Current connection state */
  connectionState: ConnectionState | 'idle';
  /** Remote participants */
  participants: LiveKitParticipant[];
  /** Active speaker identities */
  activeSpeakers: string[];
  /** Whether local audio is muted */
  isMuted: boolean;
  /** Whether local video is enabled */
  isVideoOn: boolean;
  /** Whether screen sharing is active */
  isScreenSharing: boolean;
  /** Whether E2EE is enabled on this room */
  isE2EEEnabled: boolean;
  /** The LiveKit Room instance (for advanced usage) */
  room: Room | null;
  /** Connect to the room */
  connect: () => Promise<void>;
  /** Toggle local audio mute */
  toggleMute: () => Promise<void>;
  /** Toggle local video */
  toggleVideo: () => Promise<void>;
  /** Start screen sharing */
  startScreenShare: () => Promise<void>;
  /** Stop screen sharing */
  stopScreenShare: () => Promise<void>;
  /** Leave the room */
  leaveRoom: () => Promise<void>;
  /** Error message if any */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveKitRoom(
  options: UseLiveKitRoomOptions
): UseLiveKitRoomReturn {
  const {
    roomName,
    channelId,
    groupId,
    audioEnabled = true,
    videoEnabled = false,
    autoConnect = false,
  } = options;

  const [connectionState, setConnectionState] = useState<
    ConnectionState | 'idle'
  >('idle');
  const [participants, setParticipants] = useState<LiveKitParticipant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(!audioEnabled);
  const [isVideoOn, setIsVideoOn] = useState(videoEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);
  const roomRef = useRef<Room | null>(null);

  // -------------------------------------------------------------------------
  // Fetch token from backend
  // -------------------------------------------------------------------------

  const fetchToken = useCallback(async (): Promise<{
    token: string;
    url: string;
    e2ee_key?: string;
    e2ee_enabled?: boolean;
  }> => {
    const body: Record<string, string> = { room_name: roomName };
    if (channelId) body.channel_id = channelId;
    if (groupId) body.group_id = groupId;

    const response = await apiClient.post<{
      token: string;
      url: string;
      e2ee_key?: string;
      e2ee_enabled?: boolean;
    }>(
      '/api/v1/livekit/token',
      body
    );
    return response.data;
  }, [roomName, channelId, groupId]);

  // -------------------------------------------------------------------------
  // Update participants from room state
  // -------------------------------------------------------------------------

  const updateParticipants = useCallback((lkRoom: Room) => {
    const mapped: LiveKitParticipant[] = [];
    lkRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
      mapped.push({
        identity: p.identity,
        name: p.name || p.identity,
        sid: p.sid,
        isSpeaking: p.isSpeaking,
        isMuted: !p.isMicrophoneEnabled,
        isVideoEnabled: p.isCameraEnabled,
        isScreenSharing: p.isScreenShareEnabled,
        connectionQuality: mapQuality(p.connectionQuality),
      });
    });
    setParticipants(mapped);
  }, []);

  // -------------------------------------------------------------------------
  // Connect
  // -------------------------------------------------------------------------

  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState(ConnectionState.Connecting);

      const { token, url, e2ee_key, e2ee_enabled } = await fetchToken();
      const lkRoom = await LiveKitService.connect(url, token);

      roomRef.current = lkRoom;
      setRoom(lkRoom);

      // Enable E2EE if backend provided a key
      if (e2ee_enabled && e2ee_key) {
        try {
          const roomKey = decodeRoomKey(e2ee_key);
          await LiveKitService.enableE2EE(lkRoom, roomKey);
          setIsE2EEEnabled(true);
        } catch (e2eeErr) {
          console.warn('[useLiveKitRoom] E2EE setup failed, continuing unencrypted:', e2eeErr);
          setIsE2EEEnabled(false);
        }
      }

      // Publish local tracks
      await LiveKitService.publishLocalTracks(lkRoom, {
        audio: audioEnabled,
        video: videoEnabled,
      });

      // Set up event handlers
      const cleanup = LiveKitService.attachEventHandlers(lkRoom, {
        onParticipantConnected: () => updateParticipants(lkRoom),
        onParticipantDisconnected: () => updateParticipants(lkRoom),
        onTrackSubscribed: () => updateParticipants(lkRoom),
        onTrackUnsubscribed: () => updateParticipants(lkRoom),
        onActiveSpeakersChanged: (speakers) => {
          setActiveSpeakers(speakers.map((s) => s.identity));
          updateParticipants(lkRoom);
        },
        onConnectionStateChanged: (state) => {
          setConnectionState(state);
        },
        onDisconnected: () => {
          setConnectionState(ConnectionState.Disconnected);
        },
      });

      // Track mute/unmute updates
      const handleTrackMuted = () => {
        const lp = lkRoom.localParticipant;
        setIsMuted(!lp.isMicrophoneEnabled);
        setIsVideoOn(lp.isCameraEnabled);
      };
      lkRoom.on(RoomEvent.TrackMuted, handleTrackMuted);
      lkRoom.on(RoomEvent.TrackUnmuted, handleTrackMuted);

      cleanupRef.current = () => {
        cleanup();
        lkRoom.off(RoomEvent.TrackMuted, handleTrackMuted);
        lkRoom.off(RoomEvent.TrackUnmuted, handleTrackMuted);
      };

      setConnectionState(ConnectionState.Connected);
      updateParticipants(lkRoom);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect to room';
      setError(message);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [fetchToken, audioEnabled, videoEnabled, updateParticipants]);

  // -------------------------------------------------------------------------
  // Media controls
  // -------------------------------------------------------------------------

  const toggleMute = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;

    const enabled = lkRoom.localParticipant.isMicrophoneEnabled;
    await lkRoom.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(enabled);
  }, []);

  const toggleVideo = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;

    const enabled = lkRoom.localParticipant.isCameraEnabled;
    await lkRoom.localParticipant.setCameraEnabled(!enabled);
    setIsVideoOn(!enabled);
  }, []);

  const startScreenShare = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;

    await lkRoom.localParticipant.setScreenShareEnabled(true);
    setIsScreenSharing(true);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;

    await lkRoom.localParticipant.setScreenShareEnabled(false);
    setIsScreenSharing(false);
  }, []);

  const leaveRoom = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;

    cleanupRef.current?.();
    cleanupRef.current = null;
    await LiveKitService.disconnect(lkRoom);
    roomRef.current = null;
    setRoom(null);
    setConnectionState('idle');
    setParticipants([]);
    setActiveSpeakers([]);
  }, []);

  // -------------------------------------------------------------------------
  // Auto-connect + cleanup
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      cleanupRef.current?.();
      if (roomRef.current) {
        LiveKitService.disconnect(roomRef.current);
        roomRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  return {
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
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapQuality(
  quality: number
): 'excellent' | 'good' | 'poor' | 'unknown' {
  switch (quality) {
    case 3:
      return 'excellent';
    case 2:
      return 'good';
    case 1:
      return 'poor';
    default:
      return 'unknown';
  }
}
