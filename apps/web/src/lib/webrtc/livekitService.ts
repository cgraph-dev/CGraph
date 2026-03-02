/**
 * LiveKit Service
 *
 * Client-side LiveKit integration for group voice/video calls.
 * Handles room connections, track management, and event handling.
 *
 * @module lib/webrtc/livekitService
 * @version 1.0.0
 */

import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  ConnectionState,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type RoomOptions,
  VideoPresets,
} from 'livekit-client';
import {
  setupE2EE,
  rotateKey,
  isEncrypted,
  cleanupE2EE,
} from './callEncryption';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveKitParticipant {
  identity: string;
  name: string;
  sid: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export interface LiveKitRoomState {
  connectionState: ConnectionState;
  participants: LiveKitParticipant[];
  activeSpeakers: string[];
  localParticipant: LiveKitParticipant | null;
}

export type LiveKitEventHandler = {
  onParticipantConnected?: (participant: LiveKitParticipant) => void;
  onParticipantDisconnected?: (identity: string) => void;
  onTrackSubscribed?: (
    track: Track,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  onTrackUnsubscribed?: (
    track: Track,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  onActiveSpeakersChanged?: (speakers: Participant[]) => void;
  onConnectionStateChanged?: (state: ConnectionState) => void;
  onDisconnected?: (reason?: string) => void;
};

// ---------------------------------------------------------------------------
// LiveKit Service
// ---------------------------------------------------------------------------

class LiveKitServiceImpl {
  private rooms: Map<string, Room> = new Map();

  /**
   * Connect to a LiveKit room.
   *
   * @param url - LiveKit server WebSocket URL
   * @param token - JWT access token
   * @param opts - Optional room configuration
   * @returns Connected Room instance
   */
  async connect(
    url: string,
    token: string,
    opts?: Partial<RoomOptions>
  ): Promise<Room> {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      ...opts,
    });

    await room.connect(url, token);
    this.rooms.set(room.name, room);

    return room;
  }

  /**
   * Enable E2EE on a connected room with the provided key.
   *
   * @param room - Connected Room instance
   * @param roomKey - Raw 256-bit key from backend
   */
  async enableE2EE(room: Room, roomKey: Uint8Array): Promise<void> {
    await setupE2EE(room, roomKey);
  }

  /**
   * Rotate the E2EE key for a room.
   */
  async rotateE2EEKey(room: Room, newKey: Uint8Array): Promise<void> {
    await rotateKey(room, newKey);
  }

  /**
   * Check if E2EE is active on a room.
   */
  isE2EEEnabled(room: Room): boolean {
    return isEncrypted(room);
  }

  /**
   * Publish local audio and video tracks to the room.
   */
  async publishLocalTracks(
    room: Room,
    opts: { audio?: boolean; video?: boolean } = { audio: true, video: true }
  ): Promise<void> {
    const tracks = [];

    if (opts.audio !== false) {
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      tracks.push(audioTrack);
    }

    if (opts.video !== false) {
      const videoTrack = await createLocalVideoTrack({
        resolution: VideoPresets.h720.resolution,
      });
      tracks.push(videoTrack);
    }

    await Promise.all(
      tracks.map((track) => room.localParticipant.publishTrack(track))
    );
  }

  /**
   * Register event handlers on a room.
   */
  attachEventHandlers(room: Room, handlers: LiveKitEventHandler): () => void {
    const cleanups: (() => void)[] = [];

    if (handlers.onParticipantConnected) {
      const handler = (participant: RemoteParticipant) => {
        handlers.onParticipantConnected?.(
          mapParticipant(participant)
        );
      };
      room.on(RoomEvent.ParticipantConnected, handler);
      cleanups.push(() => room.off(RoomEvent.ParticipantConnected, handler));
    }

    if (handlers.onParticipantDisconnected) {
      const handler = (participant: RemoteParticipant) => {
        handlers.onParticipantDisconnected?.(participant.identity);
      };
      room.on(RoomEvent.ParticipantDisconnected, handler);
      cleanups.push(() =>
        room.off(RoomEvent.ParticipantDisconnected, handler)
      );
    }

    if (handlers.onTrackSubscribed) {
      room.on(RoomEvent.TrackSubscribed, handlers.onTrackSubscribed);
      cleanups.push(() =>
        room.off(RoomEvent.TrackSubscribed, handlers.onTrackSubscribed!)
      );
    }

    if (handlers.onTrackUnsubscribed) {
      room.on(RoomEvent.TrackUnsubscribed, handlers.onTrackUnsubscribed);
      cleanups.push(() =>
        room.off(RoomEvent.TrackUnsubscribed, handlers.onTrackUnsubscribed!)
      );
    }

    if (handlers.onActiveSpeakersChanged) {
      room.on(
        RoomEvent.ActiveSpeakersChanged,
        handlers.onActiveSpeakersChanged
      );
      cleanups.push(() =>
        room.off(
          RoomEvent.ActiveSpeakersChanged,
          handlers.onActiveSpeakersChanged!
        )
      );
    }

    if (handlers.onConnectionStateChanged) {
      room.on(
        RoomEvent.ConnectionStateChanged,
        handlers.onConnectionStateChanged
      );
      cleanups.push(() =>
        room.off(
          RoomEvent.ConnectionStateChanged,
          handlers.onConnectionStateChanged!
        )
      );
    }

    if (handlers.onDisconnected) {
      room.on(RoomEvent.Disconnected, handlers.onDisconnected);
      cleanups.push(() =>
        room.off(RoomEvent.Disconnected, handlers.onDisconnected!)
      );
    }

    // Return cleanup function
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }

  /**
   * Get current room state snapshot.
   */
  getRoomState(room: Room): LiveKitRoomState {
    const participants: LiveKitParticipant[] = [];

    room.remoteParticipants.forEach((p) => {
      participants.push(mapParticipant(p));
    });

    return {
      connectionState: room.state,
      participants,
      activeSpeakers: room.activeSpeakers.map((s) => s.identity),
      localParticipant: room.localParticipant
        ? mapLocalParticipant(room.localParticipant)
        : null,
    };
  }

  /**
   * Disconnect from a LiveKit room and clean up resources.
   */
  async disconnect(room: Room): Promise<void> {
    cleanupE2EE(room);
    this.rooms.delete(room.name);
    await room.disconnect(true);
  }

  /**
   * Get a connected room by name.
   */
  getRoom(name: string): Room | undefined {
    return this.rooms.get(name);
  }

  /**
   * Disconnect from all rooms.
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.rooms.values()).map((room) =>
      room.disconnect(true)
    );
    await Promise.all(promises);
    this.rooms.clear();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapParticipant(participant: RemoteParticipant): LiveKitParticipant {
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    sid: participant.sid,
    isSpeaking: participant.isSpeaking,
    isMuted: !participant.isMicrophoneEnabled,
    isVideoEnabled: participant.isCameraEnabled,
    isScreenSharing: participant.isScreenShareEnabled,
    connectionQuality: mapConnectionQuality(participant.connectionQuality),
  };
}

function mapLocalParticipant(
  participant: LocalParticipant
): LiveKitParticipant {
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    sid: participant.sid,
    isSpeaking: participant.isSpeaking,
    isMuted: !participant.isMicrophoneEnabled,
    isVideoEnabled: participant.isCameraEnabled,
    isScreenSharing: participant.isScreenShareEnabled,
    connectionQuality: mapConnectionQuality(participant.connectionQuality),
  };
}

function mapConnectionQuality(
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

/** Singleton instance */
export const LiveKitService = new LiveKitServiceImpl();
