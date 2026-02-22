/**
 * IncomingCallHandler Component
 *
 * Global handler for incoming WebRTC calls.
 * Displays the IncomingCallModal when a call comes in and handles accept/decline actions.
 *
 * @version 0.9.5
 * @since 2026-01-26
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { IncomingCallModal } from './incoming-call-modal';
import { useIncomingCallStore } from '@/modules/calls/store';
import { useChatStore } from '@/modules/chat/store';

/**
 * IncomingCallHandler Component
 *
 * This component should be mounted at the app root level.
 * It listens for incoming calls from the store and displays the modal.
 */
export function IncomingCallHandler() {
  const navigate = useNavigate();
  const { incomingCall, declineCall } = useIncomingCallStore();
  const [showModal, setShowModal] = useState(false);

  // Show modal when incoming call arrives
  useEffect(() => {
    if (incomingCall) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [incomingCall]);

  const handleAccept = async (roomId: string, isVideo: boolean) => {
    if (!incomingCall) return;

    // Find the conversation with the caller to navigate there
    const { conversations } = useChatStore.getState();
    const conversation = conversations.find((conv) =>
      conv.participants.some((p) => p.userId === incomingCall.callerId)
    );

    if (conversation) {
      // Navigate to the conversation
      navigate(`/messages/${conversation.id}`);

      // The conversation page will handle answering the call
      // We pass the incoming room ID via URL query params
      const url = `/messages/${conversation.id}?incomingCall=${roomId}&callType=${isVideo ? 'video' : 'voice'}`;
      navigate(url);
    }

    // Clear the incoming call from store
    declineCall();
  };

  const handleDecline = () => {
    declineCall();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!incomingCall) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        handleAccept(incomingCall.roomId, incomingCall.type === 'video');
      } else if (e.key === 'd' || e.key === 'D') {
        handleDecline();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [incomingCall]);

  return (
    <AnimatePresence>
      {showModal && incomingCall && (
        <IncomingCallModal call={incomingCall} onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </AnimatePresence>
  );
}

export default IncomingCallHandler;
