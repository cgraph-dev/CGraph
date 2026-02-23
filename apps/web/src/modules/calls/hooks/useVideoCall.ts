/**
 * Hook for video call state and WebRTC management.
 * @module
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '@/modules/calls/hooks/useWebRTC';
import { toast } from '@/shared/components/ui';

export interface UseVideoCallOptions {
  isOpen: boolean;
  conversationId: string;
  otherParticipantId: string;
  incomingRoomId?: string;
  onClose: () => void;
}

export function useVideoCall({
  isOpen,
  conversationId,
  otherParticipantId,
  incomingRoomId,
  onClose,
}: UseVideoCallOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleEndCallRef = useRef<() => Promise<void>>(undefined);

  const {
    callState,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall: endWebRTCCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isCallActive,
    isConnecting,
  } = useWebRTC({
    conversationId,
    onCallConnected: () => {
      toast.success('Video call connected');
    },
    onCallEnded: (_reason) => {
      handleEndCallRef.current?.();
    },
    onError: (error) => {
      toast.error(`Call error: ${error}`);
      handleEndCallRef.current?.();
    },
  });

  const handleEndCall = useCallback(async () => {
    await endWebRTCCall();
    setDuration(0);
    onClose();
  }, [endWebRTCCall, onClose]);

  // Keep ref in sync so callbacks always see the latest version
  handleEndCallRef.current = handleEndCall;

  // Start or answer call when modal opens
  useEffect(() => {
    if (isOpen && !isCallActive && !incomingRoomId) {
      startCall(otherParticipantId, { video: true, audio: true });
    } else if (isOpen && !isCallActive && incomingRoomId) {
      answerCall(incomingRoomId, { video: true, audio: true });
    }
  }, [isOpen, isCallActive, incomingRoomId, otherParticipantId, startCall, answerCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Duration counter
  useEffect(() => {
    if (callState.status === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.status]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleToggleMute = useCallback(() => {
    const isMuted = toggleMute();
    toast.info(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  }, [toggleMute]);

  const handleToggleVideo = useCallback(() => {
    const isVideoOn = toggleVideo();
    toast.info(isVideoOn ? 'Camera on' : 'Camera off');
  }, [toggleVideo]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleToggleScreenShare = useCallback(async () => {
    if (callState.isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [callState.isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    callState,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isFullscreen,
    isConnecting,
    duration,
    formatDuration,
    handleEndCall,
    handleToggleMute,
    handleToggleVideo,
    handleToggleFullscreen,
    handleToggleScreenShare,
  };
}
