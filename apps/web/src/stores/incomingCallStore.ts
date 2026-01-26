import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface IncomingCall {
  roomId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  type: 'audio' | 'video';
  timestamp: number;
}

interface IncomingCallState {
  incomingCall: IncomingCall | null;
  setIncomingCall: (call: IncomingCall | null) => void;
  acceptCall: () => void;
  declineCall: () => void;
}

export const useIncomingCallStore = create<IncomingCallState>()(
  devtools(
    (set, get) => ({
      incomingCall: null,

      setIncomingCall: (call) => {
        set({ incomingCall: call });
      },

      acceptCall: () => {
        const { incomingCall } = get();
        if (incomingCall) {
          // The actual answer logic is handled by the modal component
          // This just clears the incoming call state
          set({ incomingCall: null });
        }
      },

      declineCall: () => {
        set({ incomingCall: null });
      },
    }),
    { name: 'IncomingCallStore' }
  )
);
