/**
 * useCallScreen hook - state and logic for call screen
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCall } from '@/lib/webrtc';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { CallUser, CallType, CallParticipant } from './types';

const logger = createLogger('CallScreen');

export function useCallScreen() {
  const { recipientId, callType: callTypeParam } = useParams<{
    recipientId: string;
    callType: 'audio' | 'video';
  }>();
  const [searchParams] = useSearchParams();
  const isIncoming = searchParams.get('incoming') === 'true';
  const roomId = searchParams.get('roomId');
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const {
    callState,
    localStream,
    remoteStreams,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  } = useCall();

  const [recipient, setRecipient] = useState<CallUser | null>(null);
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<number | null>(null);

  const callType: CallType = callTypeParam === 'video' ? 'video' : 'audio';

  // Fetch recipient info
  useEffect(() => {
    async function fetchRecipient() {
      if (!recipientId) return;
      try {
        const response = await api.get(`/api/v1/users/${recipientId}`);
        setRecipient(response.data);
      } catch (error) {
        logger.error('Failed to fetch recipient:', error);
      }
    }
    fetchRecipient();
  }, [recipientId]);

  // Start or answer call
  useEffect(() => {
    async function initCall() {
      if (!recipientId) return;

      const options = {
        video: callType === 'video',
        audio: true,
      };

      if (isIncoming && roomId) {
        await answerCall(roomId, options);
      } else {
        await startCall(recipientId, options);
      }
    }

    initCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (callState.status === 'connected') {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [callState.status]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (callState.status === 'connected') {
        setShowControls(false);
      }
    }, 5000);
  }, [callState.status]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Handle call end
  const handleEndCall = useCallback(async () => {
    await endCall();
    navigate(-1);
  }, [endCall, navigate]);

  // Format duration
  const formatDuration = useMemo(() => {
    const hours = Math.floor(callDuration / 3600);
    const minutes = Math.floor((callDuration % 3600) / 60);
    const seconds = callDuration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Handle screen share toggle
  const handleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Build participants list
  const participants = useMemo((): CallParticipant[] => {
    const list: CallParticipant[] = [];

    // Add local user
    list.push({
      userId: user?.id || 'local',
      stream: localStream,
      user: user as CallUser | null,
      isLocal: true,
    });

    // Add remote participants
    remoteStreams.forEach((stream, oderId) => {
      list.push({
        userId: oderId,
        stream,
        user: oderId === recipientId ? recipient : null,
        isLocal: false,
      });
    });

    return list;
  }, [user, localStream, remoteStreams, recipientId, recipient]);

  // Calculate grid layout
  const gridClass = useMemo(() => {
    const count = participants.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [participants.length]);

  // Toggle pinned user
  const togglePinnedUser = useCallback((userId: string) => {
    setPinnedUserId((prev) => (prev === userId ? null : userId));
  }, []);

  return {
    // State
    callState,
    callType,
    recipient,
    pinnedUserId,
    showControls,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    participants,
    gridClass,
    formatDuration,
    // Handlers
    resetControlsTimeout,
    handleEndCall,
    handleScreenShare,
    toggleMute,
    toggleVideo,
    togglePinnedUser,
  };
}
