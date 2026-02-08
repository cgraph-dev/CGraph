/**
 * WebRTC Types and Constants
 *
 * Shared types, interfaces, and configuration for the WebRTC module.
 *
 * @module lib/webrtc/types
 * @version 0.8.6
 */

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

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Creates a fresh default CallState
 */
export function createDefaultCallState(): CallState {
  return {
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
}
