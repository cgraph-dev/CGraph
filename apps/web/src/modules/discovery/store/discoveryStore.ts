/**
 * Discovery feed store
 *
 * Manages active feed mode and community filter for frequency surf mode.
 *
 * @module modules/discovery/store/discoveryStore
 */

import { create } from 'zustand';

export type FeedMode = 'pulse' | 'fresh' | 'rising' | 'deep_cut' | 'frequency_surf';

interface DiscoveryState {
  activeMode: FeedMode;
  selectedCommunityId: string | null;
  setMode: (mode: FeedMode) => void;
  setCommunityId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  activeMode: 'pulse' as FeedMode,
  selectedCommunityId: null as string | null,
};

export const useDiscoveryStore = create<DiscoveryState>()((set) => ({
  ...initialState,
  setMode: (mode) => set({ activeMode: mode }),
  setCommunityId: (id) => set({ selectedCommunityId: id }),
  reset: () => set(initialState),
}));
