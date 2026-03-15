/**
 * Call Screen - Voice and Video Calls
 *
 * Full-featured WebRTC call interface with:
 * - Video grid layout with PiP mode
 * - Audio-only mode with avatars
 * - Screen sharing
 * - Call controls (mute, camera, end)
 * - Connection status indicators
 */

import { motion, AnimatePresence } from 'motion/react';
import { useCallScreen } from './useCallScreen';
import { CallHeader } from './call-header';
import { VideoTile } from './video-tile';
import { ConnectingState } from './connecting-state';
import { CallControls } from './call-controls';
import type { CallStatus } from './types';

/**
 * Call Screen component.
 */
export default function CallScreen() {
  const {
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
    resetControlsTimeout,
    handleEndCall,
    handleScreenShare,
    toggleMute,
    toggleVideo,
    togglePinnedUser,
  } = useCallScreen();

  const isConnecting = callState.status === 'ringing' || callState.status === 'connecting';

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-[rgb(30,32,40)]"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-900 to-purple-900/20" />

      {/* Header */}
      <CallHeader
        recipient={recipient}
         
        callStatus={callState.status as CallStatus} // safe downcast – runtime verified
        formattedDuration={formatDuration}
        showControls={showControls}
      />

      {/* Video Grid */}
      <div className="relative z-10 flex-1 p-4">
        {isConnecting ? (
          /* safe downcast – runtime verified */

           
          <ConnectingState recipient={recipient} callStatus={callState.status as CallStatus} />
        ) : (
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
                  onPin={() => togglePinnedUser(userId)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Controls */}
      <CallControls
        showControls={showControls}
        callType={callType}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={handleScreenShare}
        onEndCall={handleEndCall}
      />

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
