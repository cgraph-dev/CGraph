/**
 * Call Store
 *
 * Zustand store for managing active call state, call history,
 * and incoming call notifications. Integrates with WebRTC manager
 * and backend call history API.
 *
 * @module stores/callStore
 * @since v0.9.47
 */

import { create } from 'zustand';
import { getCallHistory, type CallHistoryRecord } from '../services/callService';
import { getWebRTCManager, type CallState } from '../lib/webrtc/webrtcService';
import socketManager from '../lib/socket';

// ── Types ──────────────────────────────────────────────────────────────

export interface ActiveCall {
  roomId: string;
  recipientId: string;
  recipientName: string;
  callType: 'audio' | 'video';
  status: CallState['status'];
  startedAt: number | null;
}

export interface IncomingCall {
  roomId: string;
  callerId: string;
  callerName: string;
  callType: 'audio' | 'video';
}

interface CallStoreState {
  // Active call
  activeCall: ActiveCall | null;
  // Incoming call prompt
  incomingCall: IncomingCall | null;
  // Call history
  callHistory: CallHistoryRecord[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CallStoreActions {
  /** Start an outgoing call */
  startCall: (
    recipientId: string,
    recipientName: string,
    callType: 'audio' | 'video'
  ) => Promise<string | null>;
  /** Answer an incoming call */
  answerCall: (roomId: string, callType: 'audio' | 'video') => Promise<boolean>;
  /** End the current active call */
  endCall: () => Promise<void>;
  /** Set active call status */
  setCallStatus: (status: CallState['status']) => void;
  /** Set incoming call notification */
  setIncomingCall: (incoming: IncomingCall | null) => void;
  /** Fetch call history from backend */
  fetchCallHistory: (refresh?: boolean) => Promise<void>;
  /** Clear call history */
  clearHistory: () => void;
  /** Reset store */
  reset: () => void;
}

type CallStore = CallStoreState & CallStoreActions;

const initialState: CallStoreState = {
  activeCall: null,
  incomingCall: null,
  callHistory: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  error: null,
};

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  startCall: async (recipientId, recipientName, callType) => {
    try {
      const socket = socketManager.getSocket();
      if (!socket) {
        set({ error: 'Not connected to server' });
        return null;
      }

      const manager = getWebRTCManager(socket);
      const roomId = await manager.startCall(recipientId, {
        video: callType === 'video',
        audio: true,
      });

      if (roomId) {
        set({
          activeCall: {
            roomId,
            recipientId,
            recipientName,
            callType,
            status: 'ringing',
            startedAt: null,
          },
          error: null,
        });
      }

      return roomId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to start call';
      set({ error: msg });
      return null;
    }
  },

  answerCall: async (roomId, callType) => {
    try {
      const socket = socketManager.getSocket();
      if (!socket) {
        set({ error: 'Not connected to server' });
        return false;
      }

      const manager = getWebRTCManager(socket);
      const success = await manager.answerCall(roomId, {
        video: callType === 'video',
        audio: true,
      });

      if (success) {
        const incoming = get().incomingCall;
        set({
          activeCall: {
            roomId,
            recipientId: incoming?.callerId ?? '',
            recipientName: incoming?.callerName ?? 'Unknown',
            callType,
            status: 'connecting',
            startedAt: null,
          },
          incomingCall: null,
          error: null,
        });
      }

      return success;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to answer call';
      set({ error: msg });
      return false;
    }
  },

  endCall: async () => {
    try {
      const socket = socketManager.getSocket();
      if (socket) {
        const manager = getWebRTCManager(socket);
        await manager.endCall();
      }
      set({ activeCall: null });
    } catch (error) {
      console.error('[CallStore] Error ending call:', error);
      set({ activeCall: null });
    }
  },

  setCallStatus: (status) => {
    const call = get().activeCall;
    if (call) {
      set({
        activeCall: {
          ...call,
          status,
          startedAt: status === 'connected' && !call.startedAt ? Date.now() : call.startedAt,
        },
      });
    }
  },

  setIncomingCall: (incoming) => {
    set({ incomingCall: incoming });
  },

  fetchCallHistory: async (refresh = false) => {
    const state = get();
    if (state.isLoading) return;
    if (!refresh && !state.hasMore) return;

    set({ isLoading: true, error: null });

    try {
      const cursor = refresh ? undefined : (state.cursor ?? undefined);
      const response = await getCallHistory(cursor);

      set({
        callHistory: refresh ? response.data : [...state.callHistory, ...response.data],
        cursor: response.meta.cursor,
        hasMore: response.meta.has_more,
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch call history';
      set({ error: msg, isLoading: false });
    }
  },

  clearHistory: () => {
    set({ callHistory: [], cursor: null, hasMore: true });
  },

  reset: () => {
    set(initialState);
  },
}));

// ── Selector hooks ─────────────────────────────────────────────────────

export const useActiveCall = () => useCallStore((s) => s.activeCall);
export const useIncomingCall = () => useCallStore((s) => s.incomingCall);
export const useCallHistory = () => useCallStore((s) => s.callHistory);
export const useCallLoading = () => useCallStore((s) => s.isLoading);
