/**
 * Types and utilities for the user profile screen.
 * @module screens/friends/user-profile-screen/types
 */
import { UserBasic } from '../../../types';

export interface UserProfile extends UserBasic {
  bio?: string;
  created_at?: string;
  karma?: number;
  is_verified?: boolean;
  is_friend?: boolean;
  is_profile_private?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
  // TODO(phase-27): Reintroduce gamification fields when rebuilt
  // level?: number;
  // xp?: number;
  // achievements_count?: number;
  // titles?: string[];
  // current_title?: string;
  // streak?: number;
}

export const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};
