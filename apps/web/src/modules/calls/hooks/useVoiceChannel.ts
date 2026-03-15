/**
 * useVoiceChannel Hook
 *
 * Manages persistent voice channel connections via Phoenix Channel + LiveKit.
 * Handles join/leave, mute/deafen/video, and voice state synchronization.
 *
 * @module modules/calls/hooks/useVoiceChannel
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Channel } from 'phoenix';
import { useVoiceStateStore } from '@/stores/voiceStateStore';
import { LiveKitService } from '@/lib/webrtc/livekitService';
import { useSocket } from '@/lib/socket';
import type { Room } from 'livekit-client';

// ── Types ──────────────────────────────────────────────────────────────

/** Payload shape for voice channel events from Phoenix */
interface VoiceEventPayload {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  self_mute?: boolean;
  self_deafen?: boolean;
  video?: boolean;
  token?: string;
  url?: string;
  room_name?: string;
  members?: Array<Record<string, unknown>>;
}

export interface UseVoiceChannelReturn {
  /** Currently connected channel ID */
  currentChannelId: string | null;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Whether local audio is muted */
  isMuted: boolean;
  /** Whether local audio is deafened */
  isDeafened: boolean;
  /** Whether video is on */
  isVideoOn: boolean;
  /** Error message */
  error: string | null;
  /** Join a voice channel */
  joinChannel: (channelId: string, groupId: string) => Promise<void>;
  /** Leave the current voice channel */
  leaveChannel: () => Promise<void>;
  /** Toggle mute */
  toggleMute: () => void;
  /** Toggle deafen */
  toggleDeafen: () => void;
  /** Toggle video */
  toggleVideo: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────

/** Description. */
/** Hook for voice channel. */
export function useVoiceChannel(): UseVoiceChannelReturn {
  const socketManager = useSocket();
  const channelRef = useRef<Channel | null>(null);
  const roomRef = useRef<Room | null>(null);

  const {
    currentChannelId,
    isConnecting,
    isMuted,
    isDeafened,
    isVideoOn,
    error,
    setConnected,
    setDisconnected,
    setConnecting,
    toggleMute: storeToggleMute,
    toggleDeafen: storeToggleDeafen,
    toggleVideo: storeToggleVideo,
    setError,
    addChannelMember,
    removeChannelMember,
    updateMemberState,
    setChannelMembers,
  } = useVoiceStateStore();

  // ── Join Voice Channel ──────────────────────────────────────────────

  const joinChannel = useCallback(
    async (channelId: string, groupId: string) => {
      // If already in this channel, do nothing
      if (currentChannelId === channelId) return;

      // If in another channel, leave first
      if (currentChannelId) {
        await leaveChannelInternal();
      }

      setConnecting(true);
      setError(null);

      try {
        const socket = socketManager.getSocket();
        if (!socket) {
          throw new Error('Socket not connected');
        }

        // Join the Phoenix voice channel
        const channel = socket.channel(`voice:${channelId}`, {});

        // Set up event handlers
        channel.on('voice_member_joined', (_payload) => {
           
          const payload = _payload as VoiceEventPayload;
          addChannelMember(channelId, {
            userId: payload.user_id,
            username: payload.username,
            displayName: payload.display_name,
            avatarUrl: payload.avatar_url,
            selfMute: payload.self_mute ?? false,
            selfDeafen: payload.self_deafen ?? false,
            video: false,
          });
        });

        channel.on('voice_member_left', (_payload) => {
           
          const payload = _payload as VoiceEventPayload;
          removeChannelMember(channelId, payload.user_id);
        });

        channel.on('voice_state_update', (_payload) => {
           
          const payload = _payload as VoiceEventPayload;
          updateMemberState(channelId, payload.user_id, {
            selfMute: payload.self_mute,
            selfDeafen: payload.self_deafen,
            video: payload.video,
          });
        });

        channel.on('presence_state', (_payload) => {
           
          const payload = _payload as VoiceEventPayload;
          if (payload.members) {
             
            const members = (payload.members as Array<Record<string, unknown>>).map((m) => ({
               
              userId: m.user_id as string,
               
              selfMute: (m.self_mute as boolean) ?? false,
               
              selfDeafen: (m.self_deafen as boolean) ?? false,
               
              video: (m.video as boolean) ?? false,
            }));
            setChannelMembers(channelId, members);
          }
        });

        // Join and get token
        const joinResult = await new Promise<{ token: string; room_name: string }>(
          (resolve, reject) => {
            channel
              .join()
               
              .receive('ok', (resp) => resolve(resp as { token: string; room_name: string }))
              .receive('error', (resp) =>
                 
                reject(new Error((resp as { reason?: string }).reason ?? 'join_failed'))
              )
              .receive('timeout', () => reject(new Error('join_timeout')));
          }
        );

        channelRef.current = channel;

        // Connect to LiveKit using the token
        const wsUrl = import.meta.env.VITE_LIVEKIT_URL ?? 'ws://localhost:7880';
        const lkRoom = await LiveKitService.connect(wsUrl, joinResult.token);
        roomRef.current = lkRoom;

        // Publish local tracks
        await LiveKitService.publishLocalTracks(lkRoom, {
          audio: true,
          video: false,
        });

        setConnected(channelId, groupId, joinResult.token, joinResult.room_name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join voice channel';
        setError(message);
        setConnecting(false);
        // Clean up partial connection
        if (channelRef.current) {
          channelRef.current.leave();
          channelRef.current = null;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentChannelId,
      socketManager,
      setConnected,
      setConnecting,
      setError,
      addChannelMember,
      removeChannelMember,
      updateMemberState,
      setChannelMembers,
    ]
  );

  // ── Leave Voice Channel ──────────────────────────────────────────────

  const leaveChannelInternal = useCallback(async () => {
    // Send leave event via Phoenix Channel
    if (channelRef.current) {
      channelRef.current.push('leave', {});
      channelRef.current.leave();
      channelRef.current = null;
    }

    // Disconnect from LiveKit
    if (roomRef.current) {
      await LiveKitService.disconnect(roomRef.current);
      roomRef.current = null;
    }

    setDisconnected();
  }, [setDisconnected]);

  const leaveChannel = useCallback(async () => {
    await leaveChannelInternal();
  }, [leaveChannelInternal]);

  // ── Mute/Deafen/Video with server sync ──────────────────────────────

  const toggleMute = useCallback(() => {
    storeToggleMute();
    const newMuted = !useVoiceStateStore.getState().isMuted;
    // Sync to server
    channelRef.current?.push(newMuted ? 'mute' : 'unmute', {});
    // Sync to LiveKit
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    }
  }, [storeToggleMute]);

  const toggleDeafen = useCallback(() => {
    storeToggleDeafen();
    const state = useVoiceStateStore.getState();
    channelRef.current?.push(state.isDeafened ? 'undeafen' : 'deafen', {});
    // When deafened, mute mic too
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!state.isMuted);
    }
  }, [storeToggleDeafen]);

  const toggleVideo = useCallback(() => {
    storeToggleVideo();
    const newVideoOn = !useVoiceStateStore.getState().isVideoOn;
    channelRef.current?.push(newVideoOn ? 'video_on' : 'video_off', {});
    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setCameraEnabled(newVideoOn);
    }
  }, [storeToggleVideo]);

  // ── Cleanup on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.push('leave', {});
        channelRef.current.leave();
        channelRef.current = null;
      }
      if (roomRef.current) {
        LiveKitService.disconnect(roomRef.current);
        roomRef.current = null;
      }
    };
  }, []);

  return {
    currentChannelId,
    isConnecting,
    isMuted,
    isDeafened,
    isVideoOn,
    error,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    toggleVideo,
  };
}
