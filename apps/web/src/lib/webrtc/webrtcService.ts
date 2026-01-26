/**
 * WebRTC Service
 *
 * Handles peer-to-peer voice and video calls using WebRTC.
 * Connects to Phoenix Channel for signaling.
 *
 * @module lib/webrtc
 * @version 0.8.6
 */

import { Channel, Socket } from 'phoenix';

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
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
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
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onError?: (error: string) => void;
};

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * WebRTC Call Manager
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
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
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
   * Start a new call
   */
  async startCall(
    targetUserId: string,
    options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
  ): Promise<string | null> {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });
      this.state.localStream = this.localStream;
      this.state.isVideoEnabled = options.video ?? true;
      this.state.status = 'ringing';

      // Ensure socket is connected
      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }

      // Create call room via WebRTC lobby channel
      const lobbyChannel = this.socket.channel('webrtc:lobby', {});
      await new Promise((resolve, reject) => {
        lobbyChannel
          .join()
          .receive('ok', () => resolve(undefined))
          .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
      });

      // Create call room
      const response = await new Promise<{ room_id: string; ice_servers: unknown[] }>(
        (resolve, reject) => {
          lobbyChannel
            .push('create_room', {
              target_ids: [targetUserId],
              type: options.video ? 'video' : 'audio',
            })
            .receive('ok', (resp) => resolve(resp as { room_id: string; ice_servers: unknown[] }))
            .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
        }
      );

      lobbyChannel.leave();

      const roomId = response.room_id;
      this.state.roomId = roomId;

      // Join the room channel for signaling
      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }
      this.channel = this.socket.channel(`call:${roomId}`, {
        device: 'web',
        media: { audio: options.audio ?? true, video: options.video ?? true },
      });
      await this.joinChannel();
      this.setupChannelHandlers();

      return roomId;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to start call';
      this.state.status = 'idle';
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
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: options.video,
        audio: options.audio,
      });
      this.state.localStream = this.localStream;
      this.state.roomId = roomId;
      this.state.status = 'connecting';
      this.state.isVideoEnabled = options.video ?? true;

      // Ensure socket is connected
      if (!this.socket) {
        throw new Error('WebRTC socket not initialized');
      }

      // Join the room channel with media options
      this.channel = this.socket.channel(`call:${roomId}`, {
        device: 'web',
        media: { audio: options.audio ?? true, video: options.video ?? true },
      });
      await this.joinChannel();
      this.setupChannelHandlers();

      return true;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to answer call';
      this.state.status = 'idle';
      this.eventHandlers.onError?.(this.state.error);
      return false;
    }
  }

  /**
   * End the current call
   */
  async endCall(): Promise<void> {
    // Stop all tracks
    this.localStream?.getTracks().forEach((track) => track.stop());

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Leave channel
    this.channel?.leave();
    this.channel = null;

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

    this.eventHandlers.onCallEnded?.('user_ended');
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
   * Start screen sharing
   */
  async startScreenShare(): Promise<boolean> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track in all peer connections
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return false;

      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.state.isScreenSharing = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (this.localStream && this.state.isScreenSharing) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      this.state.isScreenSharing = false;
    }
  }

  // Private methods

  private async joinChannel(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    return new Promise((resolve, reject) => {
      this.channel!.join()
        .receive('ok', () => resolve())
        .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
    });
  }

  private async pushToChannel(event: string, payload: Record<string, unknown>): Promise<unknown> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    return new Promise((resolve, reject) => {
      this.channel!.push(event, payload)
        .receive('ok', (response) => resolve(response))
        .receive('error', (reason) => reject(new Error(JSON.stringify(reason))));
    });
  }

  private setupChannelHandlers(): void {
    if (!this.channel) return;

    // Handle new participant joining
    this.channel.on('user_joined', async (data: unknown) => {
      const payload = data as { user_id: string; user: CallParticipant };
      this.state.participants.push(payload.user);
      this.eventHandlers.onParticipantJoined?.(payload.user);

      // Create peer connection for new participant
      await this.createPeerConnection(payload.user_id, true);
    });

    // Handle participant leaving
    this.channel.on('user_left', (data: unknown) => {
      const payload = data as { user_id: string };
      this.state.participants = this.state.participants.filter((p) => p.userId !== payload.user_id);
      this.peerConnections.get(payload.user_id)?.close();
      this.peerConnections.delete(payload.user_id);
      this.state.remoteStreams.delete(payload.user_id);
      this.eventHandlers.onParticipantLeft?.(payload.user_id);
    });

    // Handle incoming offer
    this.channel.on('offer', async (data: unknown) => {
      const payload = data as { from: string; sdp: RTCSessionDescriptionInit };
      const pc = await this.createPeerConnection(payload.from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (this.channel) {
        this.channel.push('answer', { to: payload.from, sdp: answer });
      }
    });

    // Handle incoming answer
    this.channel.on('answer', async (data: unknown) => {
      const payload = data as { from: string; sdp: RTCSessionDescriptionInit };
      const pc = this.peerConnections.get(payload.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    });

    // Handle ICE candidate
    this.channel.on('ice_candidate', async (data: unknown) => {
      const payload = data as { from: string; candidate: RTCIceCandidateInit };
      const pc = this.peerConnections.get(payload.from);
      if (pc && payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    // Handle call ended
    this.channel.on('call_ended', (data: unknown) => {
      const payload = data as { reason: string };
      this.endCall();
      this.eventHandlers.onCallEnded?.(payload.reason);
    });
  }

  private async createPeerConnection(
    userId: string,
    initiator: boolean
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnections.set(userId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.channel) {
        this.channel.push('ice_candidate', {
          to: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        this.state.remoteStreams.set(userId, remoteStream);
        this.eventHandlers.onRemoteStream?.(userId, remoteStream);
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.state.status = 'connected';
        this.eventHandlers.onCallConnected?.();
      }
    };

    // If initiator, create and send offer
    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.channel) {
        this.channel.push('offer', { to: userId, sdp: offer });
      }
    }

    return pc;
  }
}

// Singleton instance
let webrtcManager: WebRTCManager | null = null;

/**
 * Get or create WebRTC manager instance
 */
export function getWebRTCManager(socket: Socket): WebRTCManager {
  if (!webrtcManager) {
    webrtcManager = new WebRTCManager(socket);
  }
  return webrtcManager;
}

/**
 * Destroy WebRTC manager instance
 */
export function destroyWebRTCManager(): void {
  webrtcManager?.endCall();
  webrtcManager = null;
}
