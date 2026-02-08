/**
 * WebRTC Peer Connection & Signaling
 *
 * Handles RTCPeerConnection creation, ICE candidate exchange,
 * and Phoenix Channel signaling events.
 *
 * @module lib/webrtc/peerConnection
 * @version 0.8.6
 */

import { Channel } from 'phoenix';
import { CallParticipant, CallState, CallEventHandler, ICE_SERVERS } from './types';

/**
 * Create a new RTCPeerConnection for a remote user and wire up
 * ICE candidate, track, and connection-state handlers.
 *
 * If `initiator` is true, an SDP offer is created and sent via the channel.
 */
export async function createPeerConnection(
  userId: string,
  initiator: boolean,
  localStream: MediaStream | null,
  channel: Channel | null,
  peerConnections: Map<string, RTCPeerConnection>,
  state: CallState,
  eventHandlers: CallEventHandler
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  peerConnections.set(userId, pc);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && channel) {
      channel.push('ice_candidate', {
        to: userId,
        candidate: event.candidate.toJSON(),
      });
    }
  };

  // Handle remote stream
  pc.ontrack = (event) => {
    const remoteStream = event.streams[0];
    if (remoteStream) {
      state.remoteStreams.set(userId, remoteStream);
      eventHandlers.onRemoteStream?.(userId, remoteStream);
    }
  };

  // Handle connection state
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      state.status = 'connected';
      eventHandlers.onCallConnected?.();
    }
  };

  // If initiator, create and send offer
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (channel) {
      channel.push('offer', { to: userId, sdp: offer });
    }
  }

  return pc;
}

/**
 * Set up Phoenix Channel event handlers for WebRTC signaling.
 *
 * Listens for user_joined, user_left, offer, answer, ice_candidate,
 * and call_ended events.
 */
export function setupChannelHandlers(
  channel: Channel | null,
  localStream: MediaStream | null,
  peerConnections: Map<string, RTCPeerConnection>,
  state: CallState,
  eventHandlers: CallEventHandler,
  endCallFn: () => Promise<void>
): void {
  if (!channel) return;

  // Handle new participant joining
  channel.on('user_joined', async (data: unknown) => {
    const payload = data as { user_id: string; user: CallParticipant };
    state.participants.push(payload.user);
    eventHandlers.onParticipantJoined?.(payload.user);

    // Create peer connection for new participant
    await createPeerConnection(
      payload.user_id,
      true,
      localStream,
      channel,
      peerConnections,
      state,
      eventHandlers
    );
  });

  // Handle participant leaving
  channel.on('user_left', (data: unknown) => {
    const payload = data as { user_id: string };
    state.participants = state.participants.filter((p) => p.userId !== payload.user_id);
    peerConnections.get(payload.user_id)?.close();
    peerConnections.delete(payload.user_id);
    state.remoteStreams.delete(payload.user_id);
    eventHandlers.onParticipantLeft?.(payload.user_id);
  });

  // Handle incoming offer
  channel.on('offer', async (data: unknown) => {
    const payload = data as { from: string; sdp: RTCSessionDescriptionInit };
    const pc = await createPeerConnection(
      payload.from,
      false,
      localStream,
      channel,
      peerConnections,
      state,
      eventHandlers
    );
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    channel.push('answer', { to: payload.from, sdp: answer });
  });

  // Handle incoming answer
  channel.on('answer', async (data: unknown) => {
    const payload = data as { from: string; sdp: RTCSessionDescriptionInit };
    const pc = peerConnections.get(payload.from);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }
  });

  // Handle ICE candidate
  channel.on('ice_candidate', async (data: unknown) => {
    const payload = data as { from: string; candidate: RTCIceCandidateInit };
    const pc = peerConnections.get(payload.from);
    if (pc && payload.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  });

  // Handle call ended
  channel.on('call_ended', (data: unknown) => {
    const payload = data as { reason: string };
    endCallFn();
    eventHandlers.onCallEnded?.(payload.reason);
  });
}
