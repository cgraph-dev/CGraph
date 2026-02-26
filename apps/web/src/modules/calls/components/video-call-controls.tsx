/**
 * Video call controls UI component.
 * @module
 */
import { PhoneXMarkIcon, MicrophoneIcon, VideoCameraIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';

interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing?: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
}

/**
 * unknown for the calls module.
 */
/**
 * Video Call Controls component.
 */
export function VideoCallControls({
  isMuted,
  isVideoEnabled,
  isScreenSharing = false,
  onToggleMute,
  onEndCall,
  onToggleVideo,
  onToggleScreenShare,
}: VideoCallControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">
      {/* Mute */}
      <button
        onClick={onToggleMute}
        className={`rounded-full p-4 transition-all ${
          isMuted
            ? 'bg-red-600 text-white hover:bg-red-500'
            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <MicrophoneIcon className={`h-6 w-6 ${isMuted ? 'line-through' : ''}`} />
      </button>

      {/* Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`rounded-full p-4 transition-all ${
          isVideoEnabled
            ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            : 'bg-red-600 text-white hover:bg-red-500'
        }`}
        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoEnabled ? (
          <VideoCameraIcon className="h-6 w-6" />
        ) : (
          <VideoCameraSlashIcon className="h-6 w-6" />
        )}
      </button>

      {/* Screen Share */}
      {onToggleScreenShare && (
        <button
          onClick={onToggleScreenShare}
          className={`rounded-full p-4 transition-all ${
            isScreenSharing
              ? 'bg-primary-600 text-white hover:bg-primary-500'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <ComputerDesktopIcon className="h-6 w-6" />
        </button>
      )}

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="rounded-full bg-red-600 p-5 text-white transition-all hover:bg-red-500"
        title="End call"
      >
        <PhoneXMarkIcon className="h-7 w-7" />
      </button>
    </div>
  );
}
