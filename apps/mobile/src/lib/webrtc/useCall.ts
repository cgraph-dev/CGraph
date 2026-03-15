/**
 * WebRTC Call Hook (Mobile)
 *
 * React Native hook for managing voice and video calls.
 * Compatible with the same Phoenix Channel signaling as web.
 *
 * NOTE: Full WebRTC functionality requires react-native-webrtc package.
 * For Expo managed workflow, you may need to eject or use development builds.
 *
 * @example
 * ```tsx
 * import { useCall } from '@/lib/webrtc/useCall';
 * import { RTCView } from 'react-native-webrtc';
 *
 * function CallScreen() {
 *   const {
 *     startCall,
 *     answerCall,
 *     endCall,
 *     toggleMute,
 *     toggleVideo,
 *     callState,
 *     localStream,
 *   } = useCall();
 *
 *   return (
 *     <View>
 *       {localStream && (
 *         <RTCView streamURL={localStream.toURL()} style={{ flex: 1 }} />
 *       )}
 *       <TouchableOpacity onPress={() => startCall('user-123')}>
 *         <Text>Start Call</Text>
 *       </TouchableOpacity>
 *     </View>
 *   );
 * }
 * ```
 *
 * @module lib/webrtc/useCall
 * @version 0.8.6
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { AppState, AppStateStatus } from 'react-native';
import { Socket } from 'phoenix';
import {
  WebRTCManager,
  getWebRTCManager,
  destroyWebRTCManager,
  CallState,
  CallParticipant,
  isWebRTCAvailable,
} from './webrtcService';

export interface UseCallReturn {
  /** Whether WebRTC is available */
  isSupported: boolean;
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
  /** Start a new call */
  startCall: (
    targetUserId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<string | null>;
  /** Answer incoming call */
  answerCall: (roomId: string, options?: { video?: boolean; audio?: boolean }) => Promise<boolean>;
  /** End current call */
  endCall: () => Promise<void>;
  /** Toggle mute state */
  toggleMute: () => boolean;
  /** Toggle video state */
  toggleVideo: () => boolean;
  /** Incoming call info (if ringing) */
  incomingCall: { callerId: string; callerName: string; roomId: string } | null;
  /** Accept incoming call */
  acceptIncomingCall: (options?: { video?: boolean; audio?: boolean }) => Promise<boolean>;
  /** Reject incoming call */
  rejectIncomingCall: () => void;
}

/**
 * Hook for managing WebRTC voice and video calls on mobile
 */
export function useCall(socket: Socket | null): UseCallReturn {
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
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const isSupported = isWebRTCAvailable();

  // Initialize manager when socket is available
  useEffect(() => {
    if (!socket) return;

    const rtcManager = getWebRTCManager(socket);
    setManager(rtcManager);

    // Set up event handlers
    rtcManager.on({
      onIncomingCall: (callerId, callerName, roomId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIncomingCall({ callerId, callerName, roomId });
      },
      onCallConnected: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCallState((prev) => ({ ...prev, status: 'connected' }));
      },
      onCallEnded: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCallState((prev) => ({ ...prev, status: 'ended' }));
        setIncomingCall(null);
      },
      onParticipantJoined: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCallState(rtcManager.getState());
      },
      onParticipantLeft: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCallState(rtcManager.getState());
      },
      onRemoteStream: () => {
        setCallState(rtcManager.getState());
      },
      onError: (error) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCallState((prev) => ({ ...prev, error }));
      },
    });

    return () => {
      destroyWebRTCManager();
    };
  }, [socket]);

  // Handle app state changes - end call if app goes to background during call
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/) &&
        callState.status === 'connected'
      ) {
        // Optionally end call when app goes to background
        // For now, just log - user might want to continue call
        // eslint-disable-next-line no-console
        if (__DEV__) console.log('[useCall] App went to background during call');
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [callState.status]);

  const startCall = useCallback(
    async (
      targetUserId: string,
      options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ): Promise<string | null> => {
      if (!manager) {
        console.error('[useCall] Manager not initialized');
        return null;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
    ): Promise<boolean> => {
      if (!manager) return false;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const success = await manager.answerCall(roomId, options);
      setCallState(manager.getState());
      setIncomingCall(null);
      return success;
    },
    [manager]
  );

  const endCall = useCallback(async (): Promise<void> => {
    if (!manager) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await manager.endCall();
    setCallState(manager.getState());
    setIncomingCall(null);
  }, [manager]);

  const toggleMute = useCallback((): boolean => {
    if (!manager) return false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const muted = manager.toggleMute();
    setCallState(manager.getState());
    return muted;
  }, [manager]);

  const toggleVideo = useCallback((): boolean => {
    if (!manager) return false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const enabled = manager.toggleVideo();
    setCallState(manager.getState());
    return enabled;
  }, [manager]);

  const acceptIncomingCall = useCallback(
    async (
      options: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ): Promise<boolean> => {
      if (!incomingCall) return false;
      return answerCall(incomingCall.roomId, options);
    },
    [incomingCall, answerCall]
  );

  const rejectIncomingCall = useCallback((): void => {
    if (!manager || !incomingCall) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    manager.rejectCall(incomingCall.roomId);
    setIncomingCall(null);
  }, [manager, incomingCall]);

  return {
    isSupported,
    callState,
    localStream: callState.localStream,
    remoteStreams: callState.remoteStreams,
    participants: callState.participants,
    isMuted: callState.isMuted,
    isVideoEnabled: callState.isVideoEnabled,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
  };
}

/**
 * Hook for listening to incoming calls without managing a call
 */
export function useIncomingCallListener(
  socket: Socket | null,
  onIncomingCall: (callerId: string, callerName: string, roomId: string) => void
): void {
  useEffect(() => {
    if (!socket) return;

    // Listen on the user's personal channel for incoming calls
    const channel = socket.channel('call:lobby', {});

    channel
      .join()
      .receive('ok', () => {
        // eslint-disable-next-line no-console
        if (__DEV__) console.log('[useIncomingCallListener] Joined call lobby');
      })
      .receive('error', (resp) => {
        console.error('[useIncomingCallListener] Failed to join:', resp);
      });

    channel.on('incoming_call', (payload: unknown) => {
       
      const { caller_id, caller_name, room_id } = payload as {
        caller_id: string;
        caller_name: string;
        room_id: string;
      };
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onIncomingCall(caller_id, caller_name, room_id);
    });

    return () => {
      channel.leave();
    };
  }, [socket, onIncomingCall]);
}
