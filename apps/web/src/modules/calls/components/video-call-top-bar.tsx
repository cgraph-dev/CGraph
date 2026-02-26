/**
 * Video call top bar with call info.
 * @module
 */
import { ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VideoCallTopBarProps {
  otherParticipantName: string;
  otherParticipantAvatar?: string;
  statusLabel: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

/**
 * unknown for the calls module.
 */
/**
 * Video Call Top Bar component.
 */
export function VideoCallTopBar({
  otherParticipantName,
  otherParticipantAvatar,
  statusLabel,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}: VideoCallTopBarProps) {
  return (
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
          <p className="text-xs text-gray-400">{statusLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFullscreen}
          className="rounded-lg bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <ArrowsPointingOutIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
          title="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
