/**
 * React Hook for WebRTC Call Management
 *
 * Provides a React-friendly interface to the WebRTC system for voice and video calls.
 * Handles call lifecycle, media streams, and WebSocket signaling.
 *
 * @module hooks/useWebRTC
 * @version 0.9.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/lib/socket';
import { WebRTCManager, CallState, CallEventHandler } from '@/lib/webrtc/webrtcService';
import { toast } from '@/components/Toast';
import { logger } from '@/lib/logger';

export interface UseWebRTCOptions {
  conversationId?: string;
  onCallConnected?: () => void;
  onCallEnded?: (reason: string) => void;
  onError?: (error: string) => void;
}

export interface UseWebRTCReturn {
  /** Current call state */
  callState: CallState;
  /** Local video stream (for self-view) */
  localStream: MediaStream | null;
  /** Remote video stream (for other participant) */
  remoteStream: MediaStream | null;
  /** Start a voice or video call */
  startCall: (
    targetUserId: string,
    options?: { video?: boolean; audio?: boolean }
  ) => Promise<void>;
  /** Answer an incoming call */
  answerCall: (roomId: string, options?: { video?: boolean; audio?: boolean }) => Promise<void>;
  /** End the current call */
  endCall: () => Promise<void>;
  /** Toggle mute state */
  toggleMute: () => boolean;
  /** Toggle video state */
  toggleVideo: () => boolean;
  /** Start screen sharing */
  startScreenShare: () => Promise<boolean>;
  /** Stop screen sharing */
  stopScreenShare: () => Promise<void>;
  /** Check if call is active */
  isCallActive: boolean;
  /** Check if currently connecting */
  isConnecting: boolean;
}

/**
 * Hook for managing WebRTC voice and video calls
 *
 * @example
 * ```tsx
 * const { startCall, endCall, toggleMute, callState } = useWebRTC({
 *   conversationId: '123',
 *   onCallConnected: () => console.log('Call connected!'),
 *   onCallEnded: (reason) => console.log('Call ended:', reason)
 * });
 *
 * // Start video call
 * await startCall(otherUserId, { video: true, audio: true });
 * ```
 */
export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { conversationId, onCallConnected, onCallEnded, onError } = options;
  const socketManager = useSocket();
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

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

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Initialize WebRTC manager
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) {
      logger.warn('Socket not available for WebRTC initialization');
      return;
    }

    if (!webrtcManagerRef.current) {
      webrtcManagerRef.current = new WebRTCManager(socket);

      // Register event handlers
      const handlers: CallEventHandler = {
        onCallConnected: () => {
          logger.log('WebRTC call connected');
          toast.success('Call connected');
          onCallConnected?.();
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onCallEnded: (reason: string) => {
          logger.log('WebRTC call ended:', reason);
          onCallEnded?.(reason);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onRemoteStream: (userId: string, stream: MediaStream) => {
          logger.log('Received remote stream from:', userId);
          setRemoteStream(stream);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
        onError: (error: string) => {
          logger.error('WebRTC error:', error);
          toast.error(`Call error: ${error}`);
          onError?.(error);
          // Update state from manager
          setCallState(webrtcManagerRef.current!.getState());
        },
      };

      webrtcManagerRef.current.on(handlers);
    }

    return () => {
      // Cleanup on unmount
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.endCall();
      }
    };
  }, [socketManager, onCallConnected, onCallEnded, onError]);

  /**
   * Start a new call with a target user
   */
  const startCall = useCallback(
    async (
      targetUserId: string,
      callOptions: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!webrtcManagerRef.current) {
        toast.error('WebRTC not initialized');
        return;
      }

      try {
        logger.log('Starting call to:', targetUserId, 'options:', callOptions);
        const roomId = await webrtcManagerRef.current.startCall(targetUserId, callOptions);

        if (roomId) {
          logger.log('Call initiated, room ID:', roomId);
          // Update state from manager
          setCallState(webrtcManagerRef.current.getState());
        } else {
          toast.error('Failed to start call');
        }
      } catch (error) {
        logger.error('Failed to start call:', error);
        toast.error('Failed to start call');
      }
    },
    []
  );

  /**
   * Answer an incoming call
   */
  const answerCall = useCallback(
    async (
      roomId: string,
      callOptions: { video?: boolean; audio?: boolean } = { video: true, audio: true }
    ) => {
      if (!webrtcManagerRef.current) {
        toast.error('WebRTC not initialized');
        return;
      }

      try {
        logger.log('Answering call, room ID:', roomId, 'options:', callOptions);
        const success = await webrtcManagerRef.current.answerCall(roomId, callOptions);

        if (success) {
          logger.log('Call answered successfully');
          // Update state from manager
          setCallState(webrtcManagerRef.current.getState());
        } else {
          toast.error('Failed to answer call');
        }
      } catch (error) {
        logger.error('Failed to answer call:', error);
        toast.error('Failed to answer call');
      }
    },
    []
  );

  /**
   * End the current call
   */
  const endCall = useCallback(async () => {
    if (!webrtcManagerRef.current) return;

    try {
      logger.log('Ending call');
      await webrtcManagerRef.current.endCall();
      setRemoteStream(null);
      // Update state from manager
      setCallState(webrtcManagerRef.current.getState());
    } catch (error) {
      logger.error('Failed to end call:', error);
    }
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback((): boolean => {
    if (!webrtcManagerRef.current) return false;

    const isMuted = webrtcManagerRef.current.toggleMute();
    logger.log('Mute toggled:', isMuted);
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
    return isMuted;
  }, []);

  /**
   * Toggle video state
   */
  const toggleVideo = useCallback((): boolean => {
    if (!webrtcManagerRef.current) return false;

    const isVideoOn = webrtcManagerRef.current.toggleVideo();
    logger.log('Video toggled:', isVideoOn);
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
    return isVideoOn;
  }, []);

  /**
   * Start screen sharing
   */
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    if (!webrtcManagerRef.current) return false;

    try {
      const success = await webrtcManagerRef.current.startScreenShare();
      if (success) {
        logger.log('Screen sharing started');
        toast.success('Screen sharing started');
      }
      // Update state from manager
      setCallState(webrtcManagerRef.current.getState());
      return success;
    } catch (error) {
      logger.error('Failed to start screen share:', error);
      toast.error('Failed to share screen');
      return false;
    }
  }, []);

  /**
   * Stop screen sharing
   */
  const stopScreenShare = useCallback(async () => {
    if (!webrtcManagerRef.current) return;

    await webrtcManagerRef.current.stopScreenShare();
    logger.log('Screen sharing stopped');
    toast.info('Screen sharing stopped');
    // Update state from manager
    setCallState(webrtcManagerRef.current.getState());
  }, []);

  // Derived state
  const isCallActive = callState.status === 'connected' || callState.status === 'connecting';
  const isConnecting = callState.status === 'connecting' || callState.status === 'ringing';

  return {
    callState,
    localStream: callState.localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isCallActive,
    isConnecting,
  };
}
