/**
 * UserProfile - Re-export from modular implementation
 *
 * This file has been modularized into smaller components.
 * See ./user-profile/ for the full implementation:
 * - UserProfile.tsx - Main orchestrator component
 * - ProfileBanner.tsx - Banner with edit overlay
 * - ProfileAvatar.tsx - Avatar with edit overlay and level badge
 * - ProfileNameSection.tsx - Name, badges, and title
 * - ProfileAbout.tsx - Bio section with edit mode
 * - FriendshipActions.tsx - Friend action buttons
 * - hooks/useProfileData.ts - Profile data fetching
 * - hooks/useFileUpload.ts - File upload logic
 * - types.ts - Type definitions
 */

export { UserProfile } from './user-profile/index';
export { UserProfile as default } from './user-profile/index';
