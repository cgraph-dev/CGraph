/**
 * LiveKit Service (Mobile)
 *
 * Client-side LiveKit integration for group voice/video calls on React Native.
 * Uses @livekit/react-native for room connections, track management, and events.
 *
 * @module lib/webrtc/livekitService
 * @version 1.0.0
 */

// Type declarations for livekit-client live in src/types/livekit-client.d.ts

import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type LocalParticipant,
  type Participant,
  type RoomOptions,
} from 'livekit-client';
import { registerGlobals } from '@livekit/react-native';

// Register LiveKit globals (WebRTC polyfills for React Native)
registerGlobals();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MobileLiveKitParticipant {
  identity: string;
  name: string;
  sid: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

export type MobileLiveKitEventHandler = {
  onParticipantConnected?: (participant: MobileLiveKitParticipant) => void;
  onParticipantDisconnected?: (identity: string) => void;
  onTrackSubscribed?: (
    track: Track,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  onActiveSpeakersChanged?: (speakers: Participant[]) => void;
  onConnectionStateChanged?: (state: ConnectionState) => void;
  onDisconnected?: (reason?: string) => void;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class MobileLiveKitServiceImpl {
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
      ...opts,
    });

    await room.connect(url, token);
    this.rooms.set(room.name, room);

    return room;
  }

  /**
   * Publish a local audio track to the room.
   */
  async publishAudioTrack(room: Room): Promise<void> {
    await room.localParticipant.setMicrophoneEnabled(true);
  }

  /**
   * Publish a local video track to the room.
   *
   * @param cameraFacing - 'front' or 'back' camera
   */
  async publishVideoTrack(
    room: Room,
    cameraFacing: 'front' | 'back' = 'front'
  ): Promise<void> {
    await room.localParticipant.setCameraEnabled(true);
  }

  /**
   * Toggle microphone on/off.
   */
  async toggleMicrophone(room: Room): Promise<boolean> {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    return !enabled;
  }

  /**
   * Toggle camera on/off.
   */
  async toggleCamera(room: Room): Promise<boolean> {
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
    return !enabled;
  }

  /**
   * Register event handlers on a room.
   */
  attachEventHandlers(
    room: Room,
    handlers: MobileLiveKitEventHandler
  ): () => void {
    const cleanups: (() => void)[] = [];

    if (handlers.onParticipantConnected) {
      const handler = (participant: RemoteParticipant) => {
        handlers.onParticipantConnected?.(mapParticipant(participant));
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

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }

  /**
   * Get all remote participants as mapped objects.
   */
  getParticipants(room: Room): MobileLiveKitParticipant[] {
    const mapped: MobileLiveKitParticipant[] = [];
    room.remoteParticipants.forEach((p: RemoteParticipant) => {
      mapped.push(mapParticipant(p));
    });
    return mapped;
  }

  /**
   * Disconnect from a LiveKit room and clean up resources.
   */
  async disconnect(room: Room): Promise<void> {
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

function mapParticipant(participant: RemoteParticipant): MobileLiveKitParticipant {
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    sid: participant.sid,
    isSpeaking: participant.isSpeaking,
    isMuted: !participant.isMicrophoneEnabled,
    isVideoEnabled: participant.isCameraEnabled,
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
export const MobileLiveKitService = new MobileLiveKitServiceImpl();
