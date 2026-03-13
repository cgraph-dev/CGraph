/**
 * Type declarations for livekit-client.
 *
 * Provides ambient types for the LiveKit WebRTC client library
 * so TypeScript can resolve imports in offline / CI builds.
 */
declare module 'livekit-client' {
  // ── Enums / Constants ────────────────────────────────────────────────

  export enum RoomEvent {
    ParticipantConnected = 'participantConnected',
    ParticipantDisconnected = 'participantDisconnected',
    TrackSubscribed = 'trackSubscribed',
    TrackUnsubscribed = 'trackUnsubscribed',
    TrackMuted = 'trackMuted',
    TrackUnmuted = 'trackUnmuted',
    ActiveSpeakersChanged = 'activeSpeakersChanged',
    ConnectionStateChanged = 'connectionStateChanged',
    Disconnected = 'disconnected',
    DataReceived = 'dataReceived',
    MediaDevicesError = 'mediaDevicesError',
  }

  export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
  }

  export namespace Track {
    enum Source {
      Camera = 'camera',
      Microphone = 'microphone',
      ScreenShare = 'screen_share',
      ScreenShareAudio = 'screen_share_audio',
      Unknown = 'unknown',
    }
  }

  export interface Track {
    sid: string;
    kind: string;
    source: Track.Source;
    attach(element?: HTMLMediaElement): HTMLMediaElement;
    detach(element?: HTMLMediaElement): HTMLMediaElement[];
  }

  export const VideoPresets: {
    h720: { resolution: { width: number; height: number; frameRate: number } };
    h1080: { resolution: { width: number; height: number; frameRate: number } };
    [key: string]: { resolution: { width: number; height: number; frameRate: number } };
  };

  // ── Participants ─────────────────────────────────────────────────────

  export interface TrackPublication {
    track: Track | null;
    trackSid: string;
    kind: string;
    source: Track.Source;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface RemoteTrackPublication extends TrackPublication {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface LocalTrackPublication extends TrackPublication {}

  export interface Participant {
    sid: string;
    identity: string;
    name: string;
    isSpeaking: boolean;
    isMicrophoneEnabled: boolean;
    isCameraEnabled: boolean;
    isScreenShareEnabled: boolean;
    connectionQuality: number;
    getTrackPublication(source: Track.Source): TrackPublication | undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface RemoteParticipant extends Participant {}

  export interface LocalParticipant extends Participant {
    setMicrophoneEnabled(enabled: boolean): Promise<void>;
    setCameraEnabled(enabled: boolean): Promise<void>;
    setScreenShareEnabled(enabled: boolean): Promise<void>;
    publishTrack(track: Track, options?: Record<string, unknown>): Promise<LocalTrackPublication>;
  }

  // ── Room ─────────────────────────────────────────────────────────────

  export interface RoomOptions {
    adaptiveStream?: boolean;
    dynacast?: boolean;
    videoCaptureDefaults?: {
      resolution?: { width: number; height: number; frameRate?: number };
    };
    e2ee?: E2EEOptions;
    [key: string]: unknown;
  }

  export interface E2EEOptions {
    keyProvider: ExternalE2EEKeyProvider;
    [key: string]: unknown;
  }

  /** ExternalE2EEKeyProvider class. */
  export class ExternalE2EEKeyProvider {
    constructor();
    /** Description. */
    setKey(key: CryptoKey | Uint8Array, participantIdentity?: string): void;
  }

  /** Room class. */
  export class Room {
    constructor(opts?: RoomOptions);
    name: string;
    state: ConnectionState;
    localParticipant: LocalParticipant;
    remoteParticipants: Map<string, RemoteParticipant>;
    activeSpeakers: Participant[];
    isE2EEEnabled: boolean;
    /** Description. */
    setE2EEEnabled(enabled: boolean, options?: E2EEOptions): Promise<void>;
    /** Description. */
    connect(url: string, token: string): Promise<void>;
    /** Description. */
    disconnect(stopTracks?: boolean | string): Promise<void>;
    /** Description. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: RoomEvent | string, handler: (...args: any[]) => void): this;
    /** Description. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(event: RoomEvent | string, handler: (...args: any[]) => void): this;
    /** Description. */
    emit(event: RoomEvent | string, ...args: unknown[]): boolean;
  }

  // ── Track factories ──────────────────────────────────────────────────

  export function createLocalAudioTrack(options?: Record<string, unknown>): Promise<Track>;
  export function createLocalVideoTrack(options?: Record<string, unknown>): Promise<Track>;
}
