/**
 * Voice State Store
 *
 * Zustand store for managing persistent voice channel state.
 * Tracks which voice channel the user is in, connected members,
 * and local audio/video state.
 *
 * @module stores/voiceStateStore
 */

import { create } from 'zustand';

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
  /** Currently connected voice channel ID (null if not in any) */
  currentChannelId: string | null;
  /** Group ID of the current voice channel */
  currentGroupId: string | null;
  /** LiveKit room token for current connection */
  currentRoomToken: string | null;
  /** LiveKit room name */
  currentRoomName: string | null;
  /** Members per channel: Map<channelId, VoiceMember[]> */
  channelMembers: Record<string, VoiceMember[]>;
  /** Local mute state */
  isMuted: boolean;
  /** Local deafen state */
  isDeafened: boolean;
  /** Local video state */
  isVideoOn: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Error message */
  error: string | null;
}

interface VoiceStateActions {
  /** Set the current voice channel connection */
  setConnected: (channelId: string, groupId: string, token: string, roomName: string) => void;
  /** Clear the current voice channel connection */
  setDisconnected: () => void;
  /** Set connecting state */
  setConnecting: (connecting: boolean) => void;
  /** Toggle local mute */
  toggleMute: () => void;
  /** Toggle local deafen (also mutes) */
  toggleDeafen: () => void;
  /** Toggle local video */
  toggleVideo: () => void;
  /** Set mute state directly */
  setMuted: (muted: boolean) => void;
  /** Set deafen state directly */
  setDeafened: (deafened: boolean) => void;
  /** Update members for a specific channel */
  setChannelMembers: (channelId: string, members: VoiceMember[]) => void;
  /** Add a member to a channel */
  addChannelMember: (channelId: string, member: VoiceMember) => void;
  /** Remove a member from a channel */
  removeChannelMember: (channelId: string, userId: string) => void;
  /** Update a member's voice state */
  updateMemberState: (channelId: string, userId: string, state: Partial<VoiceMember>) => void;
  /** Set error */
  setError: (error: string | null) => void;
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

  setConnected: (channelId, groupId, token, roomName) =>
    set({
      currentChannelId: channelId,
      currentGroupId: groupId,
      currentRoomToken: token,
      currentRoomName: roomName,
      isConnecting: false,
      error: null,
    }),

  setDisconnected: () =>
    set({
      currentChannelId: null,
      currentGroupId: null,
      currentRoomToken: null,
      currentRoomName: null,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isConnecting: false,
    }),

  setConnecting: (connecting) => set({ isConnecting: connecting }),

  toggleMute: () => {
    const { isMuted, isDeafened } = get();
    // If deafened and unmuting, also undeafen
    if (isDeafened && isMuted) {
      set({ isMuted: false, isDeafened: false });
    } else {
      set({ isMuted: !isMuted });
    }
  },

  toggleDeafen: () => {
    const { isDeafened } = get();
    if (isDeafened) {
      set({ isDeafened: false });
    } else {
      // Deafening also mutes
      set({ isDeafened: true, isMuted: true });
    }
  },

  toggleVideo: () => set((s) => ({ isVideoOn: !s.isVideoOn })),

  setMuted: (muted) => set({ isMuted: muted }),
  setDeafened: (deafened) => set({ isDeafened: deafened, ...(deafened ? { isMuted: true } : {}) }),

  setChannelMembers: (channelId, members) =>
    set((s) => ({
      channelMembers: { ...s.channelMembers, [channelId]: members },
    })),

  addChannelMember: (channelId, member) =>
    set((s) => {
      const existing = s.channelMembers[channelId] ?? [];
      // Avoid duplicates
      if (existing.some((m) => m.userId === member.userId)) return s;
      return {
        channelMembers: { ...s.channelMembers, [channelId]: [...existing, member] },
      };
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
          [channelId]: existing.map((m) =>
            m.userId === userId ? { ...m, ...state } : m
          ),
        },
      };
    }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
