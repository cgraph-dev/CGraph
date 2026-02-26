/**
 * Types and constants for profile visibility screen.
 * @module screens/settings/profile-visibility-screen/types
 */
import { Ionicons } from '@expo/vector-icons';

export type VisibilityLevel = 'public' | 'friends' | 'private';

export interface VisibilitySettings {
  profileVisibility: VisibilityLevel;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showPostCount: boolean;
  showJoinDate: boolean;
  showBio: boolean;
  showSocialLinks: boolean;
  showActivity: boolean;
  allowMessaging: 'everyone' | 'friends' | 'nobody';
  showInMemberList: boolean;
  showInSearch: boolean;
}

export const DEFAULT_SETTINGS: VisibilitySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  showLastActive: true,
  showPostCount: true,
  showJoinDate: true,
  showBio: true,
  showSocialLinks: true,
  showActivity: true,
  allowMessaging: 'everyone',
  showInMemberList: true,
  showInSearch: true,
};

export const VISIBILITY_OPTIONS: {
  value: VisibilityLevel;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view your profile',
    icon: 'globe',
  },
  {
    value: 'friends',
    label: 'Friends Only',
    description: 'Only friends can view your full profile',
    icon: 'people',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see your profile details',
    icon: 'lock-closed',
  },
];

export const MESSAGING_OPTIONS: { value: string; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'nobody', label: 'Nobody' },
];
