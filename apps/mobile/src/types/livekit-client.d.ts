/**
 * Ambient type declarations for livekit-client.
 *
 * livekit-client is a peer dependency of @livekit/react-native but may not be
 * installed in all environments. When livekit-client IS installed these
 * declarations are overridden by the real package types.
 */
declare module 'livekit-client' {
  export class Room {
    constructor(options?: RoomOptions);
    name: string;
    localParticipant: LocalParticipant;
    remoteParticipants: Map<string, RemoteParticipant>;
    connect(url: string, token: string): Promise<void>;
    disconnect(stopTracks?: boolean): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, handler: (...args: any[]) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(event: string, handler: (...args: any[]) => void): this;
  }
  export enum RoomEvent {
    ParticipantConnected = 'participantConnected',
    ParticipantDisconnected = 'participantDisconnected',
    TrackSubscribed = 'trackSubscribed',
    ActiveSpeakersChanged = 'activeSpeakersChanged',
    ConnectionStateChanged = 'connectionStateChanged',
    Disconnected = 'disconnected',
  }
  export enum Track {
    Source = 'source',
  }
  export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
  }
  export interface Participant {
    identity: string;
    name: string;
    sid: string;
    isSpeaking: boolean;
    isMicrophoneEnabled: boolean;
    isCameraEnabled: boolean;
    connectionQuality: number;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface RemoteParticipant extends Participant {}
  export interface LocalParticipant extends Participant {
    setMicrophoneEnabled(enabled: boolean): Promise<void>;
    setCameraEnabled(enabled: boolean): Promise<void>;
  }
  export interface RemoteTrackPublication {
    trackSid: string;
  }
  export interface RoomOptions {
    adaptiveStream?: boolean;
    dynacast?: boolean;
    [key: string]: unknown;
  }
}
