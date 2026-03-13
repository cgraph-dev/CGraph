/**
 * Mobile Voice State Store
 *
 * Zustand store for persistent voice channel state on mobile.
 * Mirrors the web voiceStateStore with mobile-appropriate patterns.
 *
 * @module stores/voiceStateStore
 * @since v0.9.50
 */

import { create } from 'zustand';
import socketManager from '../lib/socket';

// ── Types ──────────────────────────────────────────────────────────────

export interface VoiceMember {
  userId: string;
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  selfMute: boolean;
  selfDeafen: boolean;
  video: boolean;
  isSpeaking?: boolean;
}

interface VoiceStateState {
  /** Currently connected voice channel ID */
  currentChannelId: string | null;
  /** Group ID of the current voice channel */
  currentGroupId: string | null;
  /** LiveKit room token */
  currentRoomToken: string | null;
  /** LiveKit room name */
  currentRoomName: string | null;
  /** Members per channel */
  channelMembers: Record<string, VoiceMember[]>;
  /** Local mute state */
  isMuted: boolean;
  /** Local deafen state */
  isDeafened: boolean;
  /** Local video state */
  isVideoOn: boolean;
  /** Connecting flag */
  isConnecting: boolean;
  /** Error message */
  error: string | null;
}

interface VoiceStateActions {
  /** Join a voice channel via Phoenix Channel */
  joinChannel: (channelId: string, groupId: string) => Promise<void>;
  /** Leave the current voice channel */
  leaveChannel: () => void;
  /** Toggle local mute */
  toggleMute: () => void;
  /** Toggle local deafen */
  toggleDeafen: () => void;
  /** Toggle local video */
  toggleVideo: () => void;
  /** Set channel members */
  setChannelMembers: (channelId: string, members: VoiceMember[]) => void;
  /** Add a channel member */
  addChannelMember: (channelId: string, member: VoiceMember) => void;
  /** Remove a channel member */
  removeChannelMember: (channelId: string, userId: string) => void;
  /** Update a member's voice state */
  updateMemberState: (channelId: string, userId: string, state: Partial<VoiceMember>) => void;
  /** Reset store */
  reset: () => void;
}

type VoiceStateStore = VoiceStateState & VoiceStateActions;

const initialState: VoiceStateState = {
  currentChannelId: null,
  currentGroupId: null,
  currentRoomToken: null,
  currentRoomName: null,
  channelMembers: {},
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  isConnecting: false,
  error: null,
};

// ── Store ──────────────────────────────────────────────────────────────

export const useVoiceStateStore = create<VoiceStateStore>()((set, get) => ({
  ...initialState,

  joinChannel: async (channelId: string, groupId: string) => {
    const state = get();

    // If already in this channel, no-op
    if (state.currentChannelId === channelId) return;

    // Leave previous channel first
    if (state.currentChannelId) {
      get().leaveChannel();
    }

    set({ isConnecting: true, error: null });

    try {
      const topic = `voice:${channelId}`;

      // Join Phoenix voice channel
      const channel = socketManager.joinChannel(topic, {});

      if (!channel) {
        throw new Error('Failed to join voice channel');
      }

      // Wait for join response with token
      const joinPromise = new Promise<{ token: string; room_name: string }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Join timeout')), 10000);

        channel.on('phx_reply', (rawPayload?: unknown) => {
          clearTimeout(timeout);
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const payload = rawPayload as Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const response = payload.response as { token: string; room_name: string } | undefined;
          if (response?.token) {
            resolve(response);
          }
        });

        channel.on('phx_error', (_payload?: unknown) => {
          clearTimeout(timeout);
          reject(new Error('Channel join error'));
        });
      });

      // Set up event handlers
      channel.on('voice_member_joined', (rawPayload?: unknown) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const payload = rawPayload as Record<string, unknown>;
        get().addChannelMember(channelId, {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          userId: payload.user_id as string,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          username: payload.username as string,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          displayName: payload.display_name as string | null,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          avatarUrl: payload.avatar_url as string | null,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          selfMute: (payload.self_mute as boolean) ?? false,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          selfDeafen: (payload.self_deafen as boolean) ?? false,
          video: false,
        });
      });

      channel.on('voice_member_left', (rawPayload?: unknown) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const payload = rawPayload as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        get().removeChannelMember(channelId, payload.user_id as string);
      });

      channel.on('voice_state_update', (rawPayload?: unknown) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const payload = rawPayload as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        get().updateMemberState(channelId, payload.user_id as string, {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          selfMute: payload.self_mute as boolean,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          selfDeafen: payload.self_deafen as boolean,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          video: payload.video as boolean,
        });
      });

      channel.on('presence_state', (rawPayload?: unknown) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const payload = rawPayload as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const members = payload.members as VoiceMember[] | undefined;
        if (members) {
          get().setChannelMembers(channelId, members);
        }
      });

      const result = await joinPromise;

      set({
        currentChannelId: channelId,
        currentGroupId: groupId,
        currentRoomToken: result.token,
        currentRoomName: result.room_name,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join';
      set({ isConnecting: false, error: message });
    }
  },

  leaveChannel: () => {
    const { currentChannelId } = get();
    if (currentChannelId) {
      const topic = `voice:${currentChannelId}`;
      // Send leave event before disconnecting
      const channel = socketManager.getChannel?.(topic);
      if (channel) {
        channel.push('leave', {});
      }
      socketManager.leaveChannel(topic);
    }
    set({
      currentChannelId: null,
      currentGroupId: null,
      currentRoomToken: null,
      currentRoomName: null,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
    });
  },

  toggleMute: () => {
    const { isMuted, isDeafened, currentChannelId } = get();
    if (isDeafened && isMuted) {
      set({ isMuted: false, isDeafened: false });
    } else {
      set({ isMuted: !isMuted });
    }
    if (currentChannelId) {
      const topic = `voice:${currentChannelId}`;
      const channel = socketManager.getChannel?.(topic);
      channel?.push(get().isMuted ? 'mute' : 'unmute', {});
    }
  },

  toggleDeafen: () => {
    const { isDeafened, currentChannelId } = get();
    if (isDeafened) {
      set({ isDeafened: false });
    } else {
      set({ isDeafened: true, isMuted: true });
    }
    if (currentChannelId) {
      const topic = `voice:${currentChannelId}`;
      const channel = socketManager.getChannel?.(topic);
      channel?.push(get().isDeafened ? 'deafen' : 'undeafen', {});
    }
  },

  toggleVideo: () => {
    const { isVideoOn, currentChannelId } = get();
    set({ isVideoOn: !isVideoOn });
    if (currentChannelId) {
      const topic = `voice:${currentChannelId}`;
      const channel = socketManager.getChannel?.(topic);
      channel?.push(isVideoOn ? 'video_off' : 'video_on', {});
    }
  },

  setChannelMembers: (channelId, members) =>
    set((s) => ({
      channelMembers: { ...s.channelMembers, [channelId]: members },
    })),

  addChannelMember: (channelId, member) =>
    set((s) => {
      const existing = s.channelMembers[channelId] ?? [];
      if (existing.some((m) => m.userId === member.userId)) return s;
      return { channelMembers: { ...s.channelMembers, [channelId]: [...existing, member] } };
    }),

  removeChannelMember: (channelId, userId) =>
    set((s) => {
      const existing = s.channelMembers[channelId] ?? [];
      return {
        channelMembers: {
          ...s.channelMembers,
          [channelId]: existing.filter((m) => m.userId !== userId),
        },
      };
    }),

  updateMemberState: (channelId, userId, state) =>
    set((s) => {
      const existing = s.channelMembers[channelId] ?? [];
      return {
        channelMembers: {
          ...s.channelMembers,
          [channelId]: existing.map((m) => (m.userId === userId ? { ...m, ...state } : m)),
        },
      };
    }),

  reset: () => set(initialState),
}));
