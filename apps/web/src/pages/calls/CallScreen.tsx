/**
 * Call Screen - Voice and Video Calls
 *
 * Full-featured WebRTC call interface with:
 * - Video grid layout with PiP mode
 * - Audio-only mode with avatars
 * - Screen sharing
 * - Call controls (mute, camera, end)
 * - Connection status indicators
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '@/lib/webrtc';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CallScreen');

// =============================================================================
// TYPES
// =============================================================================

interface CallUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

type CallType = 'audio' | 'video';

// =============================================================================
// CONSTANTS
// =============================================================================

const CALL_STATES = {
  idle: 'Initializing...',
  ringing: 'Calling...',
  connecting: 'Connecting...',
  connected: 'Connected',
  ended: 'Call Ended',
  error: 'Connection Error',
} as const;

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const controlVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 50 },
};

const pulseAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: { duration: 2, repeat: Infinity },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface VideoTileProps {
  stream: MediaStream | null;
  user: CallUser | null;
  isMuted?: boolean;
  isLocal?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
}

function VideoTile({
  stream,
  user,
  isMuted = false,
  isLocal = false,
  isPinned = false,
  onPin,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((t) => t.enabled);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative overflow-hidden rounded-2xl bg-dark-800 ${isPinned ? 'col-span-2 row-span-2' : ''} ${isLocal ? 'ring-2 ring-primary-500/50' : ''}`}
      onClick={onPin}
    >
      {hasVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user.displayName}
              size="xlarge"
              className="h-24 w-24 ring-4 ring-dark-700"
              avatarBorderId={
                (user as CallUser)?.avatarBorderId ?? (user as CallUser)?.avatar_border_id ?? null
              }
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-3xl font-bold text-white">
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {isLocal ? 'You' : user?.displayName || 'Unknown'}
          </span>
          {isMuted && (
            <div className="rounded-full bg-red-500/80 p-1">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Pin Badge */}
      {isPinned && (
        <div className="absolute right-3 top-3 rounded-lg bg-primary-500/80 p-1.5">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
      )}

      {/* Local Badge */}
      {isLocal && (
        <div className="absolute left-3 top-3 rounded-lg bg-dark-800/80 px-2 py-1 text-xs text-gray-300">
          You
        </div>
      )}
    </motion.div>
  );
}

interface CallControlProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

function CallControl({ icon, label, onClick, active, danger, disabled }: CallControlProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors ${
        danger
          ? 'bg-red-500 text-white hover:bg-red-600'
          : active
            ? 'bg-primary-500 text-white'
            : 'bg-dark-700/80 text-gray-300 hover:bg-dark-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CallScreen() {
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

  // Build participants list for rendering
  const participants = useMemo(() => {
    const list: {
      userId: string;
      stream: MediaStream | null;
      user: CallUser | null;
      isLocal: boolean;
    }[] = [];

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

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-dark-900"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-purple-900/20" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        className="relative z-10 flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-4">
          {recipient && (
            <>
              {recipient.avatarUrl ? (
                <ThemedAvatar
                  src={recipient.avatarUrl}
                  alt={recipient.displayName}
                  size="medium"
                  className="h-12 w-12 ring-2 ring-primary-500/50"
                  avatarBorderId={recipient.avatarBorderId ?? recipient.avatar_border_id ?? null}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-xl font-bold text-white">
                  {recipient.displayName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">{recipient.displayName}</h2>
                <p className="text-sm text-gray-400">
                  {callState.status === 'connected'
                    ? formatDuration
                    : CALL_STATES[callState.status]}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Connection Quality Indicator */}
        <div className="flex items-center gap-2 rounded-full bg-dark-800/80 px-3 py-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1 rounded-full transition-all duration-300 ${
                  bar <= 3 ? 'bg-green-500' : 'bg-dark-600'
                }`}
                style={{ height: `${bar * 4}px` }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">Good</span>
        </div>
      </motion.div>

      {/* Video Grid */}
      <div className="relative z-10 flex-1 p-4">
        {callState.status === 'ringing' || callState.status === 'connecting' ? (
          // Connecting State
          <div className="flex h-full flex-col items-center justify-center">
            <motion.div
              animate={pulseAnimation}
              className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-primary-500/20"
            >
              {recipient?.avatarUrl ? (
                <ThemedAvatar
                  src={recipient.avatarUrl}
                  alt={recipient.displayName}
                  size="xlarge"
                  className="h-24 w-24"
                  avatarBorderId={recipient.avatarBorderId ?? recipient.avatar_border_id ?? null}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-4xl font-bold text-white">
                  {recipient?.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </motion.div>
            <h2 className="mb-2 text-2xl font-semibold text-white">{recipient?.displayName}</h2>
            <p className="text-gray-400">{CALL_STATES[callState.status]}</p>

            {/* Animated Rings */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                  }}
                  className="absolute h-32 w-32 rounded-full border-2 border-primary-500/30"
                />
              ))}
            </div>
          </div>
        ) : (
          // Connected State - Video Grid
          <div className={`grid h-full ${gridClass} gap-4`}>
            <AnimatePresence>
              {participants.map(({ userId, stream, user: participantUser, isLocal }) => (
                <VideoTile
                  key={userId}
                  stream={stream}
                  user={participantUser}
                  isLocal={isLocal}
                  isMuted={isLocal ? isMuted : false}
                  isPinned={pinnedUserId === userId}
                  onPin={() => setPinnedUserId(pinnedUserId === userId ? null : userId)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            variants={controlVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 bg-gradient-to-t from-dark-900 to-transparent p-6"
          >
            <div className="flex items-center justify-center gap-4">
              {/* Mute */}
              <CallControl
                icon={
                  isMuted ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )
                }
                label={isMuted ? 'Unmute' : 'Mute'}
                onClick={toggleMute}
                active={isMuted}
              />

              {/* Video */}
              {callType === 'video' && (
                <CallControl
                  icon={
                    isVideoEnabled ? (
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} />
                      </svg>
                    )
                  }
                  label={isVideoEnabled ? 'Hide Video' : 'Show Video'}
                  onClick={toggleVideo}
                  active={!isVideoEnabled}
                />
              )}

              {/* Screen Share */}
              <CallControl
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
                onClick={handleScreenShare}
                active={isScreenSharing}
              />

              {/* End Call */}
              <CallControl
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.28 3H5z"
                    />
                  </svg>
                }
                label="End Call"
                onClick={handleEndCall}
                danger
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {callState.error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-red-500/90 px-6 py-3 text-white shadow-lg"
          >
            {callState.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
