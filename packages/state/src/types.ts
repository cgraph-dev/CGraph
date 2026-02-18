/**
 * State Types
 */

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface UserState {
  id: string | null;
  username: string | null;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  premiumTier: 'free' | 'premium' | 'enterprise' | null;
  level: number;
  xp: number;
  coins: number;
}

export interface GamificationState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  coins: number;
  achievements: string[];
  activeQuests: string[];
  completedQuests: string[];
  equippedTitle: string | null;
  equippedBadges: string[];
}

export interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    sounds: boolean;
    vibration: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showReadReceipts: boolean;
    showTypingIndicator: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface StoreActions<T> {
  reset: () => void;
  set: (partial: Partial<T>) => void;
}

export type SliceCreator<T, A = object> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) => T & A;
