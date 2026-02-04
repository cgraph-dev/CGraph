/**
 * Calls Module Types
 *
 * Type definitions for voice/video call functionality.
 *
 * @module modules/calls/types
 * @version 1.0.0
 */

// Re-export store types
export type { IncomingCall, IncomingCallState } from '../store/incomingCallStore';

/**
 * Call type
 */
export type CallType = 'voice' | 'video';

/**
 * Call state
 */
export type CallState =
  | 'idle'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

/**
 * Call participant
 */
export interface CallParticipant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  joinedAt: string;
}

/**
 * Active call
 */
export interface ActiveCall {
  id: string;
  type: CallType;
  state: CallState;
  startedAt: string;
  participants: CallParticipant[];
  isGroupCall: boolean;
  conversationId?: string;
  groupId?: string;
  channelId?: string;
}

/**
 * Call settings
 */
export interface CallSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioInputDeviceId?: string;
  audioOutputDeviceId?: string;
  videoInputDeviceId?: string;
  noiseSuppressionEnabled: boolean;
  echoCancellationEnabled: boolean;
  autoGainControlEnabled: boolean;
  videoQuality: 'low' | 'medium' | 'high' | 'hd';
}

/**
 * Media devices
 */
export interface MediaDevices {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

/**
 * WebRTC stats
 */
export interface WebRTCStats {
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  timestamp: number;
}

/**
 * Call invite
 */
export interface CallInvite {
  callId: string;
  type: CallType;
  callerId: string;
  callerUsername: string;
  callerDisplayName: string | null;
  callerAvatarUrl: string | null;
  conversationId?: string;
  groupId?: string;
  channelId?: string;
  timestamp: string;
}

/**
 * Call ended reason
 */
export type CallEndedReason =
  | 'local_hangup'
  | 'remote_hangup'
  | 'declined'
  | 'missed'
  | 'busy'
  | 'timeout'
  | 'error'
  | 'network_failure';

/**
 * Call ended event
 */
export interface CallEndedEvent {
  callId: string;
  reason: CallEndedReason;
  duration?: number;
  timestamp: string;
}

/**
 * Screen share options
 */
export interface ScreenShareOptions {
  audio: boolean;
  cursor: 'always' | 'motion' | 'never';
  surfaceSwitching: 'include' | 'exclude';
}

/**
 * Call quality metrics
 */
export interface CallQualityMetrics {
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  videoQuality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
  bitrate: number;
}
