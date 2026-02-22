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

export { default as CallScreen } from './call-screen';
export { VideoTile } from './video-tile';
export { CallControl } from './call-control';
export { CallHeader } from './call-header';
export { ConnectingState } from './connecting-state';
export { CallControls } from './call-controls';
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
