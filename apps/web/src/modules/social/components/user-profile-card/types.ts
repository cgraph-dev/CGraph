/**
 * User Profile Card Types
 *
 * Type definitions for the user profile card module
 */

import type { ProfileCardUser } from '../ProfileCard';

export type { ProfileCardUser };

/**
 * Props for the main UserProfileCard component
 */
export interface UserProfileCardProps {
  userId: string;
  user?: ProfileCardUser;
  variant?: 'mini' | 'full';
  trigger?: 'hover' | 'click' | 'both';
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Props for the MiniProfileCard sub-component
 */
export interface MiniProfileCardProps {
  user: ProfileCardUser;
  onViewProfile: () => void;
  onMessage: () => void;
}

/**
 * Props for the FullProfileCard sub-component
 */
export interface FullProfileCardProps {
  user: ProfileCardUser;
  mutualFriends: MutualFriend[];
  onClose: () => void;
}

/**
 * Mutual friend data structure
 */
export interface MutualFriend {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Position for portal-rendered cards
 */
export interface CardPosition {
  top: number;
  left: number;
}
