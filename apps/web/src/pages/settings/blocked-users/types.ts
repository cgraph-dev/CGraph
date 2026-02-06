/**
 * Types for Blocked Users module
 */

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
}
