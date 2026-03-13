/**
 * WebRTC Module (Mobile)
 *
 * Exports WebRTC service and hooks for voice/video calls.
 *
 * @module lib/webrtc
 * @version 0.8.6
 */

export {
  WebRTCManager,
  getWebRTCManager,
  destroyWebRTCManager,
  isWebRTCAvailable,
  type CallState,
  type CallParticipant,
  type CallEventHandler,
} from './webrtcService';

export { useCall, useIncomingCallListener, type UseCallReturn } from './useCall';
