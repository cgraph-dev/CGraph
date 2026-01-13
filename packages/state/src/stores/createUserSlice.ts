/**
 * User Store Slice
 * 
 * Manages current user profile data.
 */

import type { UserState, SliceCreator } from '../types';

export interface UserActions {
  setUser: (user: Partial<UserState>) => void;
  clearUser: () => void;
  updateProfile: (updates: Partial<UserState>) => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

const initialUserState: UserState = {
  id: null,
  username: null,
  displayName: null,
  email: null,
  avatar: null,
  premiumTier: null,
  level: 1,
  xp: 0,
  coins: 0,
};

export const createUserSlice: SliceCreator<UserState, UserActions> = (set, get) => ({
  ...initialUserState,

  setUser: (user) =>
    set({
      ...user,
    }),

  clearUser: () => set(initialUserState),

  updateProfile: (updates) =>
    set(updates),

  addXP: (amount) => {
    const currentXP = get().xp;
    const currentLevel = get().level;
    const newXP = currentXP + amount;
    
    // Calculate if level up
    const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
    if (newXP >= xpForNextLevel) {
      set({ xp: newXP - xpForNextLevel, level: currentLevel + 1 });
    } else {
      set({ xp: newXP });
    }
  },

  addCoins: (amount) => {
    const currentCoins = get().coins;
    set({ coins: currentCoins + amount });
  },

  spendCoins: (amount) => {
    const currentCoins = get().coins;
    if (currentCoins >= amount) {
      set({ coins: currentCoins - amount });
      return true;
    }
    return false;
  },
});

// Helper function for XP calculation
function calculateXPForLevel(level: number): number {
  // XP = 100 * level^1.5 (exponential growth)
  return Math.floor(100 * Math.pow(level, 1.5));
}

export const userSelectors = {
  id: (state: UserState) => state.id,
  username: (state: UserState) => state.username,
  displayName: (state: UserState) => state.displayName || state.username,
  avatar: (state: UserState) => state.avatar,
  isPremium: (state: UserState) => 
    state.premiumTier !== null && state.premiumTier !== 'free',
  level: (state: UserState) => state.level,
  xp: (state: UserState) => state.xp,
  coins: (state: UserState) => state.coins,
  xpProgress: (state: UserState) => {
    const xpForNext = calculateXPForLevel(state.level + 1);
    return (state.xp / xpForNext) * 100;
  },
};
