/**
 * WebRTC Call Hook
 *
 * React hook for managing voice and video calls.
 *
 * @example
 * ```tsx
 * function CallComponent() {
 *   const {
 *     startCall,
 *     answerCall,
 *     endCall,
 *     toggleMute,
 *     toggleVideo,
 *     callState,
 *     localStream,
 *     remoteStreams,
 *   } = useCall();
 *
 *   return (
 *     <div>
 *       <video ref={(el) => el && (el.srcObject = localStream)} autoPlay muted />
 *       {Array.from(remoteStreams.entries()).map(([id, stream]) => (
 *         <video key={id} ref={(el) => el && (el.srcObject = stream)} autoPlay />
 *       ))}
 *       <button onClick={() => startCall('user-123', { video: true })}>
 *         Start Call
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module hooks/useCall
 * @version 0.8.6
 */

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket';
import {
  WebRTCManager,
  getWebRTCManager,
  destroyWebRTCManager,
  CallState,
  CallParticipant,
} from './webrtcService';

export interface UseCallReturn {
  /** Current call state */
  callState: CallState;
  /** Local media stream */
  localStream: MediaStream | null;
  /** Map of remote streams by user ID */
  remoteStreams: Map<string, MediaStream>;
  /** List of call participants */
  participants: CallParticipant[];
  /** Whether user is muted */
  isMuted: boolean;
  /** Whether video is enabled */
  isVideoEnabled: boolean;
  /** Whether screen sharing is active */
  isScreenSharing: boolean;
  /** Start a new call */
  startCall: (
    targetUserId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<string | null>;
  /** Answer incoming call */
  answerCall: (
    roomId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<boolean>;
  /** End current call */
  endCall: () => Promise<void>;
  /** Toggle mute state */
  toggleMute: () => boolean;
  /** Toggle video state */
  toggleVideo: () => boolean;
  /** Start screen sharing */
  startScreenShare: () => Promise<boolean>;
  /** Stop screen sharing */
  stopScreenShare: () => Promise<void>;
  /** Incoming call info (if ringing) */
  incomingCall: { callerId: string; callerName: string; roomId: string } | null;
  /** Accept incoming call */
  acceptIncomingCall: (options?: { video?: boolean; audio?: boolean }) => Promise<boolean>;
  /** Reject incoming call */
  rejectIncomingCall: () => void;
}

/**
 * Hook for managing WebRTC voice and video calls
 */
export function useCall(): UseCallReturn {
  const socketManager = useSocket();
  const [manager, setManager] = useState<WebRTCManager | null>(null);
  const [callState, setCallState] = useState<CallState>({
    roomId: null,
    status: 'idle',
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null,
  });
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    roomId: string;
  } | null>(null);

  // Initialize manager when socket is available
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;
    
    const rtcManager = getWebRTCManager(socket);
    setManager(rtcManager);

    // Set up event handlers
    rtcManager.on({
      onIncomingCall: (callerId, callerName, roomId) => {
        setIncomingCall({ callerId, callerName, roomId });
      },
      onCallConnected: () => {
        setCallState((prev) => ({ ...prev, status: 'connected' }));
      },
      onCallEnded: () => {
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        setIncomingCall(null);
      },
      onParticipantJoined: () => {
        setCallState(rtcManager.getState());
      },
      onParticipantLeft: () => {
        setCallState(rtcManager.getState());
      },
      onRemoteStream: () => {
        setCallState(rtcManager.getState());
      },
      onError: (error) => {
        setCallState((prev) => ({ ...prev, error }));
      },
    });

    return () => {
      destroyWebRTCManager();
    };
  }, [socketManager]);

  const startCall = useCallback(
    async (
      targetUserId: string,
      options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!manager) return null;
      const roomId = await manager.startCall(targetUserId, options);
      setCallState(manager.getState());
      return roomId;
    },
    [manager]
  );

  const answerCall = useCallback(
    async (
      roomId: string,
      options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!manager) return false;
      const success = await manager.answerCall(roomId, options);
      setCallState(manager.getState());
      return success;
    },
    [manager]
  );

  const endCall = useCallback(async () => {
    if (!manager) return;
    await manager.endCall();
    setCallState(manager.getState());
  }, [manager]);

  const toggleMute = useCallback(() => {
    if (!manager) return false;
    const isMuted = manager.toggleMute();
    setCallState((prev) => ({ ...prev, isMuted }));
    return isMuted;
  }, [manager]);

  const toggleVideo = useCallback(() => {
    if (!manager) return true;
    const isVideoEnabled = manager.toggleVideo();
    setCallState((prev) => ({ ...prev, isVideoEnabled }));
    return isVideoEnabled;
  }, [manager]);

  const startScreenShare = useCallback(async () => {
    if (!manager) return false;
    const success = await manager.startScreenShare();
    setCallState((prev) => ({ ...prev, isScreenSharing: success }));
    return success;
  }, [manager]);

  const stopScreenShare = useCallback(async () => {
    if (!manager) return;
    await manager.stopScreenShare();
    setCallState((prev) => ({ ...prev, isScreenSharing: false }));
  }, [manager]);

  const acceptIncomingCall = useCallback(
    async (options?: { video?: boolean; audio?: boolean }) => {
      if (!incomingCall) return false;
      const success = await answerCall(incomingCall.roomId, options);
      if (success) {
        setIncomingCall(null);
      }
      return success;
    },
    [incomingCall, answerCall]
  );

  const rejectIncomingCall = useCallback(() => {
    setIncomingCall(null);
    // Could send rejection to server here
  }, []);

  return {
    callState,
    localStream: callState.localStream,
    remoteStreams: callState.remoteStreams,
    participants: callState.participants,
    isMuted: callState.isMuted,
    isVideoEnabled: callState.isVideoEnabled,
    isScreenSharing: callState.isScreenSharing,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
  };
}

export default useCall;
