import { motion, AnimatePresence } from 'framer-motion';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import { useVideoCall } from '@/modules/calls/hooks/useVideoCall';
import { VideoCallTopBar } from '@/modules/calls/components/VideoCallTopBar';
import { VideoCallControls } from '@/modules/calls/components/VideoCallControls';

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
  const {
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
  } = useVideoCall({ isOpen, conversationId, otherParticipantId, incomingRoomId, onClose });

  if (!isOpen) return null;

  const statusLabel =
    callState.status === 'ringing' || isConnecting
      ? 'Calling...'
      : callState.status === 'connected'
        ? formatDuration(duration)
        : callState.status === 'ended'
          ? 'Call ended'
          : '';

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
          <VideoCallTopBar
            otherParticipantName={otherParticipantName}
            otherParticipantAvatar={otherParticipantAvatar}
            statusLabel={statusLabel}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onClose={handleEndCall}
          />

          {/* Main Video Area */}
          <div className="relative h-full w-full bg-dark-950">
            {/* Remote Participant Video */}
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

          <VideoCallControls
            isMuted={callState.isMuted}
            isVideoEnabled={callState.isVideoEnabled}
            onToggleMute={handleToggleMute}
            onEndCall={handleEndCall}
            onToggleVideo={handleToggleVideo}
          />

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
