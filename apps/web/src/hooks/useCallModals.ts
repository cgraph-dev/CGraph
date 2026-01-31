/**
 * useCallModals Hook
 *
 * Handles voice and video call modal state.
 *
 * @module hooks/useCallModals
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

export interface CallModalState {
  showVoiceCallModal: boolean;
  showVideoCallModal: boolean;
  incomingRoomId: string | undefined;
}

export interface CallModalHandlers {
  handleStartVoiceCall: (enableHaptic?: boolean) => void;
  handleStartVideoCall: (enableHaptic?: boolean) => void;
  closeVoiceCallModal: () => void;
  closeVideoCallModal: () => void;
}

export function useCallModals(
  conversationId: string | undefined
): CallModalState & CallModalHandlers {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [incomingRoomId, setIncomingRoomId] = useState<string | undefined>(undefined);

  // Handle incoming call query params - auto-answer calls from notifications
  useEffect(() => {
    const incomingCallParam = searchParams.get('incomingCall');
    const callTypeParam = searchParams.get('callType');

    if (incomingCallParam && callTypeParam) {
      setIncomingRoomId(incomingCallParam);

      if (callTypeParam === 'video') {
        setShowVideoCallModal(true);
      } else {
        setShowVoiceCallModal(true);
      }

      // Clean up query params
      searchParams.delete('incomingCall');
      searchParams.delete('callType');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleStartVoiceCall = useCallback(
    (enableHaptic = false) => {
      if (!conversationId) return;
      setShowVoiceCallModal(true);
      if (enableHaptic) HapticFeedback.medium();
    },
    [conversationId]
  );

  const handleStartVideoCall = useCallback(
    (enableHaptic = false) => {
      if (!conversationId) return;
      setShowVideoCallModal(true);
      if (enableHaptic) HapticFeedback.medium();
    },
    [conversationId]
  );

  const closeVoiceCallModal = useCallback(() => {
    setShowVoiceCallModal(false);
    setIncomingRoomId(undefined);
  }, []);

  const closeVideoCallModal = useCallback(() => {
    setShowVideoCallModal(false);
    setIncomingRoomId(undefined);
  }, []);

  return {
    showVoiceCallModal,
    showVideoCallModal,
    incomingRoomId,
    handleStartVoiceCall,
    handleStartVideoCall,
    closeVoiceCallModal,
    closeVideoCallModal,
  };
}
