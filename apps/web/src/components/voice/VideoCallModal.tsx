import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneXMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/Toast';
import { useWebRTC } from '@/hooks/useWebRTC';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantAvatar?: string;
  /** If provided, answer this incoming call instead of starting a new one */
  incomingRoomId?: string;
}

export function VideoCallModal({
  isOpen,
  onClose,
  conversationId,
  otherParticipantId,
  otherParticipantName,
  otherParticipantAvatar,
  incomingRoomId,
}: VideoCallModalProps) {
  const { user: _user } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC integration
  const {
    callState,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall: endWebRTCCall,
    toggleMute,
    toggleVideo,
    isCallActive,
    isConnecting,
  } = useWebRTC({
    conversationId,
    onCallConnected: () => {
      toast.success('Video call connected');
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
      // Start outgoing video call
      startCall(otherParticipantId, { video: true, audio: true });
    } else if (isOpen && !isCallActive && incomingRoomId) {
      // Answer incoming video call
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

  // Handle video toggle
  const handleToggleVideo = () => {
    const isVideoOn = toggleVideo();
    toast.info(isVideoOn ? 'Camera on' : 'Camera off');
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative overflow-hidden bg-dark-900 ${
            isFullscreen ? 'h-screen w-screen' : 'h-[80vh] w-[90vw] max-w-6xl rounded-2xl'
          }`}
        >
          {/* Top Bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                {otherParticipantAvatar ? (
                  <img
                    src={otherParticipantAvatar}
                    alt={otherParticipantName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {otherParticipantName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{otherParticipantName}</h3>
                <p className="text-xs text-gray-400">
                  {(callState.status === 'ringing' || isConnecting) && 'Calling...'}
                  {callState.status === 'connected' && formatDuration(duration)}
                  {callState.status === 'ended' && 'Call ended'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFullscreen}
                className="rounded-lg bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleEndCall}
                className="rounded-lg bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Video Area */}
          <div className="relative h-full w-full bg-dark-950">
            {/* Remote Participant Video (Full Screen) */}
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
              {remoteStream && callState.status === 'connected' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="mb-4 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                    {otherParticipantAvatar ? (
                      <img
                        src={otherParticipantAvatar}
                        alt={otherParticipantName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white">
                        {otherParticipantName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {(callState.status === 'ringing' || isConnecting) && (
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-gray-400"
                    >
                      Connecting...
                    </motion.p>
                  )}
                </div>
              )}
            </div>

            {/* Local Participant Video (Picture-in-Picture) */}
            <div className="absolute bottom-20 right-4 h-40 w-56 overflow-hidden rounded-lg border-2 border-white/20 bg-dark-800 shadow-2xl">
              {localStream && callState.isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-dark-900">
                  <VideoCameraSlashIcon className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
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

            {/* Video Toggle */}
            <button
              onClick={handleToggleVideo}
              className={`rounded-full p-4 transition-all ${
                callState.isVideoEnabled
                  ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
              title={callState.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {callState.isVideoEnabled ? (
                <VideoCameraIcon className="h-6 w-6" />
              ) : (
                <VideoCameraSlashIcon className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* WebRTC Connection Info (Development) */}
          {import.meta.env.DEV && (
            <div className="absolute bottom-0 left-0 bg-black/60 px-4 py-2">
              <p className="text-xs text-gray-400">
                Room: {callState.roomId || 'Not connected'} | Status: {callState.status}
              </p>
              <p className="text-xs text-gray-400">
                Video: {callState.isVideoEnabled ? 'On' : 'Off'} | Muted:{' '}
                {callState.isMuted ? 'Yes' : 'No'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
