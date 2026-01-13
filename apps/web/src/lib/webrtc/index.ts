/**
 * WebRTC Module
 *
 * Voice and video call infrastructure for CGraph.
 *
 * @module lib/webrtc
 * @version 0.8.6
 */

export { WebRTCManager, getWebRTCManager, destroyWebRTCManager } from './webrtcService';
export type { CallState, CallParticipant, CallEventHandler } from './webrtcService';

export { useCall } from './useCall';
export type { UseCallReturn } from './useCall';
