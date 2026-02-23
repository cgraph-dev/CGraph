/** @module Privacy field visibility configuration constants. */

/**
 * Configuration for per-field profile visibility toggles.
 * Each entry maps a privacy settings key to a user-facing label and description.
 */
export const PROFILE_FIELD_VISIBILITY_OPTIONS = [
  { key: 'showBio', label: 'Bio', desc: 'Show your bio on your profile' },
  { key: 'showPostCount', label: 'Post Count', desc: 'Show your total post count' },
  { key: 'showJoinDate', label: 'Join Date', desc: 'Show when you joined' },
  {
    key: 'showLastActive',
    label: 'Last Active',
    desc: 'Show your last active time',
  },
  {
    key: 'showSocialLinks',
    label: 'Social Links',
    desc: 'Show linked social accounts',
  },
  {
    key: 'showActivity',
    label: 'Activity Feed',
    desc: 'Show recent activity on your profile',
  },
  {
    key: 'showInMemberList',
    label: 'Member List',
    desc: 'Appear in forum member lists',
  },
] as const;
