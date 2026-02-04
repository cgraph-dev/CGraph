/**
 * WebRTC Service (Mobile)
 *
 * Handles peer-to-peer voice and video calls using WebRTC.
 * Uses Phoenix Channels for signaling - connects to the same backend as web.
 *
 * NOTE: Requires react-native-webrtc package for full functionality.
 * For Expo managed workflow, consider expo-av for audio-only calls
 * or eject to bare workflow for full WebRTC support.
 *
 * @module lib/webrtc
 * @version 0.8.6
 */

import { Channel, Socket } from 'phoenix';

// =============================================================================
// WebRTC Type Definitions for React Native
// These provide proper typing for react-native-webrtc package
// =============================================================================

/** Media stream track from react-native-webrtc */
interface RTCMediaStreamTrack {
  id: string;
  kind: 'audio' | 'video';
  enabled: boolean;
  stop(): void;
}

/** RTCPeerConnection type for react-native-webrtc */
interface RTCPeerConnectionType {
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(): Promise<RTCSessionDescriptionInit>;
  setLocalDescription(desc: RTCSessionDescriptionInit): Promise<void>;
  setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  addTrack(track: RTCMediaStreamTrack, stream: RTCMediaStream): void;
  close(): void;
  connectionState: RTCPeerConnectionState;
  onicecandidate: ((event: RTCIceCandidateEvent) => void) | null;
  ontrack: ((event: RTCTrackEvent) => void) | null;
  onconnectionstatechange: (() => void) | null;
}

/** RTCPeerConnection state values */
type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

/** ICE Candidate event */
interface RTCIceCandidateEvent {
  candidate: RTCIceCandidateInit | null;
}

/** ICE Candidate initialization */
interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  toJSON(): RTCIceCandidateInit;
}

/** Track event with remote streams */
interface RTCTrackEvent {
  streams: RTCMediaStream[];
  track: RTCMediaStreamTrack;
}

/** Session description initialization */
interface RTCSessionDescriptionInit {
  type: RTCSessionDescriptionType;
  sdp?: string;
}

type RTCSessionDescriptionType = 'offer' | 'answer' | 'pranswer' | 'rollback';

// Declare WebRTC constructors from react-native-webrtc
// These will be available when the package is installed
declare const RTCPeerConnection: new (config: RTCConfiguration) => RTCPeerConnectionType;
declare const RTCSessionDescription: new (
  init: RTCSessionDescriptionInit
) => RTCSessionDescriptionInit;
declare const RTCIceCandidate: new (init: RTCIceCandidateInit) => RTCIceCandidateInit;

/** RTCPeerConnection configuration */
interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** Navigator with mediaDevices for react-native-webrtc */
interface NavigatorWithMedia extends Navigator {
  mediaDevices: {
    getUserMedia(constraints: MediaStreamConstraints): Promise<RTCMediaStream>;
  };
}

interface MediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

interface MediaTrackConstraints {
  facingMode?: string;
  width?: number;
  height?: number;
}

// Extended MediaStream type for react-native-webrtc
interface RTCMediaStream {
  getTracks(): RTCMediaStreamTrack[];
  getAudioTracks(): RTCMediaStreamTrack[];
  getVideoTracks(): RTCMediaStreamTrack[];
  toURL(): string;
}

// Types
export interface CallParticipant {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
}

export interface CallState {
  roomId: string | null;
  status: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
  participants: CallParticipant[];
  localStream: RTCMediaStream | null;
  remoteStreams: Map<string, RTCMediaStream>;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

export type CallEventHandler = {
  onIncomingCall?: (callerId: string, callerName: string, roomId: string) => void;
  onCallConnected?: () => void;
  onCallEnded?: (reason: string) => void;
  onParticipantJoined?: (participant: CallParticipant) => void;
  onParticipantLeft?: (userId: string) => void;
  onRemoteStream?: (userId: string, stream: RTCMediaStream) => void;
  onError?: (error: string) => void;
};

// ICE servers for STUN/TURN
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Check if WebRTC is available (react-native-webrtc must be installed)
 */
export function isWebRTCAvailable(): boolean {
  return typeof RTCPeerConnection !== 'undefined';
}

/**
 * WebRTC Call Manager for Mobile
 *
 * Manages the complete lifecycle of voice/video calls including:
 * - Signaling via Phoenix Channels
 * - Peer connection management
 * - Media stream handling
 * - Multi-party call support (up to 10 participants via mesh)
 */
export class WebRTCManager {
  private socket: Socket | null = null;
  private channel: Channel | null = null;

  private peerConnections: Map<string, RTCPeerConnectionType> = new Map();
  private localStream: RTCMediaStream | null = null;
  private eventHandlers: CallEventHandler = {};

  private state: CallState = {
    roomId: null,
    status: 'idle',
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null,
  };

  /**
   * Initialize WebRTC manager with Phoenix socket
   */
  constructor(socket: Socket) {
    this.socket = socket;
  }

  /**
   * Register event handlers
   */
  on(handlers: CallEventHandler): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get current call state
   */
  getState(): CallState {
    return { ...this.state };
  }

  /**
   * Check if WebRTC is supported
   */
  isSupported(): boolean {
    return isWebRTCAvailable();
  }

  /**
   * Start a new call
   */
  async startCall(
    targetUserId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
  ): Promise<string | null> {
    if (!this.isSupported()) {
      this.state.error =
        'WebRTC is not available. Install react-native-webrtc for full functionality.';
      this.eventHandlers.onError?.(this.state.error);
      return null;
    }

    try {
      // Get local media stream (requires react-native-webrtc)
      this.localStream = await (navigator as NavigatorWithMedia).mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });
      this.state.localStream = this.localStream;
      this.state.isVideoEnabled = options.video ?? true;

      // Join signaling channel
      this.channel = this.socket!.channel('call:lobby', {});
      await this.joinChannel();

      // Create call room
      const response = await this.pushToChannel('create_room', {
        target_user_id: targetUserId,
        call_type: options.video ? 'video' : 'audio',
      });

      const roomId = (response as { room_id: string }).room_id;
      this.state.roomId = roomId;
      this.state.status = 'ringing';

      // Join the room channel
      this.channel = this.socket!.channel(`call:${roomId}`, {});
      await this.joinChannel();
      this.setupChannelHandlers();

      return roomId;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to start call';
      this.eventHandlers.onError?.(this.state.error);
      return null;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(
    roomId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
  ): Promise<boolean> {
    if (!this.isSupported()) {
      this.state.error = 'WebRTC is not available';
      this.eventHandlers.onError?.(this.state.error);
      return false;
    }

    try {
      // Get local media stream
      this.localStream = await (navigator as NavigatorWithMedia).mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });
      this.state.localStream = this.localStream;
      this.state.isVideoEnabled = options.video ?? true;

      // Join call room channel
      this.channel = this.socket!.channel(`call:${roomId}`, {});
      await this.joinChannel();
      this.setupChannelHandlers();

      // Notify server we're answering
      await this.pushToChannel('answer', { video: options.video });

      this.state.roomId = roomId;
      this.state.status = 'connecting';

      return true;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to answer call';
      this.eventHandlers.onError?.(this.state.error);
      return false;
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<void> {
    try {
      // Notify server
      if (this.channel) {
        await this.pushToChannel('leave', {});
        this.channel.leave();
      }

      // Close all peer connections
      this.peerConnections.forEach((pc) => pc.close());
      this.peerConnections.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      // Reset state
      this.state = {
        roomId: null,
        status: 'ended',
        participants: [],
        localStream: null,
        remoteStreams: new Map(),
        isMuted: false,
        isVideoEnabled: true,
        isScreenSharing: false,
        error: null,
      };

      this.eventHandlers.onCallEnded?.('call_ended');
    } catch (error) {
      console.error('[WebRTC] Error ending call:', error);
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.state.isMuted = !audioTrack.enabled;
      }
    }
    return this.state.isMuted;
  }

  /**
   * Toggle video state
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.state.isVideoEnabled = videoTrack.enabled;
      }
    }
    return this.state.isVideoEnabled;
  }

  /**
   * Reject an incoming call
   */
  async rejectCall(roomId: string): Promise<void> {
    try {
      const channel = this.socket!.channel(`call:${roomId}`, {});
      await new Promise<void>((resolve, reject) => {
        channel
          .join()
          .receive('ok', () => {
            channel.push('reject', {});
            channel.leave();
            resolve();
          })
          .receive('error', reject);
      });
    } catch (error) {
      console.error('[WebRTC] Error rejecting call:', error);
    }
  }

  // Private methods

  private async joinChannel(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel!.join()
        .receive('ok', () => resolve())
        .receive('error', (resp: { reason?: string }) =>
          reject(new Error(resp?.reason || 'Failed to join channel'))
        );
    });
  }

  private pushToChannel(event: string, payload: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.channel!.push(event, payload)
        .receive('ok', resolve)
        .receive('error', (resp: { reason?: string }) =>
          reject(new Error(resp?.reason || 'Push failed'))
        );
    });
  }

  private setupChannelHandlers(): void {
    if (!this.channel) return;

    // Handle incoming offer
    this.channel.on('offer', async (payload: unknown) => {
      const { from, sdp } = payload as { from: string; sdp: string };
      try {
        const pc = this.getOrCreatePeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await this.pushToChannel('answer_sdp', { to: from, sdp: answer.sdp });
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    });

    // Handle incoming answer
    this.channel.on('answer_sdp', async (payload: unknown) => {
      const { from, sdp } = payload as { from: string; sdp: string };
      try {
        const pc = this.peerConnections.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
        }
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    });

    // Handle ICE candidates
    this.channel.on('ice_candidate', async (payload: unknown) => {
      const { from, candidate } = payload as {
        from: string;
        candidate: RTCIceCandidateInit | null;
      };
      try {
        const pc = this.peerConnections.get(from);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    });

    // Handle participant joined
    this.channel.on('user_joined', (payload: unknown) => {
      const { user } = payload as { user: CallParticipant };
      this.state.participants.push(user);
      this.eventHandlers.onParticipantJoined?.(user);
      this.initiateConnection(user.userId);
    });

    // Handle participant left
    this.channel.on('user_left', (payload: unknown) => {
      const { user_id } = payload as { user_id: string };
      this.state.participants = this.state.participants.filter((p) => p.userId !== user_id);
      this.state.remoteStreams.delete(user_id);
      this.peerConnections.get(user_id)?.close();
      this.peerConnections.delete(user_id);
      this.eventHandlers.onParticipantLeft?.(user_id);
    });

    // Handle call connected
    this.channel.on('call_connected', () => {
      this.state.status = 'connected';
      this.eventHandlers.onCallConnected?.();
    });

    // Handle call ended
    this.channel.on('call_ended', (payload: unknown) => {
      const { reason } = payload as { reason: string };
      this.endCall();
      this.eventHandlers.onCallEnded?.(reason);
    });
  }

  private getOrCreatePeerConnection(userId: string): RTCPeerConnectionType {
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: RTCMediaStreamTrack) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event: RTCIceCandidateEvent) => {
      if (event.candidate) {
        this.pushToChannel('ice_candidate', {
          to: userId,
          candidate: event.candidate.toJSON(),
        }).catch(console.error);
      }
    };

    // Handle remote tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      const [stream] = event.streams;
      this.state.remoteStreams.set(userId, stream);
      this.eventHandlers.onRemoteStream?.(userId, stream);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (__DEV__) console.log(`[WebRTC] Connection state for ${userId}: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        this.state.status = 'connected';
        this.eventHandlers.onCallConnected?.();
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  private async initiateConnection(userId: string): Promise<void> {
    try {
      const pc = this.getOrCreatePeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await this.pushToChannel('offer', {
        to: userId,
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error('[WebRTC] Error initiating connection:', error);
    }
  }
}

// Singleton instance management
let managerInstance: WebRTCManager | null = null;

export function getWebRTCManager(socket: Socket): WebRTCManager {
  if (!managerInstance) {
    managerInstance = new WebRTCManager(socket);
  }
  return managerInstance;
}

export function destroyWebRTCManager(): void {
  if (managerInstance) {
    managerInstance.endCall();
    managerInstance = null;
  }
}
