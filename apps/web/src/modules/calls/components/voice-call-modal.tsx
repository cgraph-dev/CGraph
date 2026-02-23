/**
 * Voice call modal dialog component.
 * @module
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneXMarkIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { toast } from '@/shared/components/ui';
import { useWebRTC } from '@/modules/calls/hooks/useWebRTC';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantAvatar?: string;
  /** If provided, answer this incoming call instead of starting a new one */
  incomingRoomId?: string;
}

export function VoiceCallModal({
  isOpen,
  onClose,
  conversationId,
  otherParticipantId,
  otherParticipantName,
  otherParticipantAvatar,
  incomingRoomId,
}: VoiceCallModalProps) {
  const { user: _user } = useAuthStore();
  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC integration
  const {
    callState,
    localStream: _localStream,
    remoteStream: _remoteStream,
    startCall,
    answerCall,
    endCall: endWebRTCCall,
    toggleMute,
    isCallActive,
    isConnecting,
  } = useWebRTC({
    conversationId,
    onCallConnected: () => {
      toast.success('Call connected');
    },
    onCallEnded: (_reason) => {
      handleEndCall();
    },
    onError: (error) => {
      toast.error(`Call error: ${error}`);
      handleEndCall();
    },
  });

  // Start call when modal opens
  useEffect(() => {
    if (isOpen && !isCallActive && !incomingRoomId) {
      // Start outgoing call
      startCall(otherParticipantId, { video: false, audio: true });
    } else if (isOpen && !isCallActive && incomingRoomId) {
      // Answer incoming call
      answerCall(incomingRoomId, { video: false, audio: true });
    }
  }, [isOpen, isCallActive, incomingRoomId, otherParticipantId, startCall, answerCall]);

  // Start duration counter when connected
  useEffect(() => {
    if (callState.status === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.status]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle ending call
  const handleEndCall = async () => {
    await endWebRTCCall();
    setDuration(0);
    onClose();
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    const isMuted = toggleMute();
    toast.info(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={handleEndCall}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-gray-400 transition-colors hover:bg-white/20 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Participant Info */}
          <div className="flex flex-col items-center justify-center px-6 py-12">
            {/* Avatar */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  scale: callState.status === 'ringing' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: callState.status === 'ringing' ? Infinity : 0,
                }}
                className="h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600"
              >
                {otherParticipantAvatar ? (
                  <img
                    src={otherParticipantAvatar}
                    alt={otherParticipantName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                    {otherParticipantName.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>

              {/* Pulsing ring for calling state */}
              {(callState.status === 'ringing' || isConnecting) && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>

            {/* Name */}
            <h2 className="mb-2 text-2xl font-bold text-white">{otherParticipantName}</h2>

            {/* Status */}
            <p className="text-gray-400">
              {(callState.status === 'ringing' || isConnecting) && 'Calling...'}
              {callState.status === 'connected' && formatDuration(duration)}
              {callState.status === 'ended' && 'Call ended'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 border-t border-white/10 px-6 py-6">
            {/* Mute */}
            <button
              onClick={handleToggleMute}
              className={`rounded-full p-4 transition-all ${
                callState.isMuted
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
              title={callState.isMuted ? 'Unmute' : 'Mute'}
            >
              <MicrophoneIcon className={`h-6 w-6 ${callState.isMuted ? 'line-through' : ''}`} />
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="rounded-full bg-red-600 p-5 text-white transition-all hover:bg-red-500"
              title="End call"
            >
              <PhoneXMarkIcon className="h-7 w-7" />
            </button>

            {/* Speaker (Placeholder - Audio output routing is browser-controlled) */}
            <button
              className="rounded-full bg-white/10 p-4 text-gray-300 transition-all hover:bg-white/20 hover:text-white"
              title="Speaker"
            >
              <SpeakerWaveIcon className="h-6 w-6" />
            </button>
          </div>

          {/* WebRTC Connection Info (Development) */}
          {import.meta.env.DEV && (
            <div className="border-t border-white/10 px-6 py-3">
              <p className="text-xs text-gray-500">
                Room: {callState.roomId || 'Not connected'} | Status: {callState.status}
              </p>
              <p className="text-xs text-gray-500">
                Participants: {callState.participants.length} | Muted:{' '}
                {callState.isMuted ? 'Yes' : 'No'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
