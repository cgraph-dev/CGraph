/**
 * CallScreen module - WebRTC voice and video calls
 *
 * This module provides:
 * - Video grid layout with pinning
 * - Audio-only mode with avatars
 * - Screen sharing support
 * - Call controls (mute, camera, end)
 * - Connection status indicators
 * - Call duration tracking
 */

export { default as CallScreen } from './CallScreen';
export { VideoTile } from './VideoTile';
export { CallControl } from './CallControl';
export { CallHeader } from './CallHeader';
export { ConnectingState } from './ConnectingState';
export { CallControls } from './CallControls';
export { useCallScreen } from './useCallScreen';
export { CALL_STATES, controlVariants, pulseAnimation } from './constants';
export type {
  CallUser,
  CallType,
  CallStatus,
  CallParticipant,
  VideoTileProps,
  CallControlProps,
} from './types';
