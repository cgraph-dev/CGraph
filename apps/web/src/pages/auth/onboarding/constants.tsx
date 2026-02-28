/**
 * Constants and static data for Onboarding module
 */

import type { OnboardingStep, Feature, NotificationOption } from './types';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to CGraph',
    description: "Let's set up your profile to get you started",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Personalize Your Profile',
    description: 'Tell us a bit about yourself',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Find Friends',
    description: 'Search for people you know',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Join a Community',
    description: 'Find communities that interest you',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

export const FEATURES: Feature[] = [
  {
    icon: '💬',
    title: 'Encrypted Messaging',
    description: 'End-to-end encrypted private conversations',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Create communities with group servers',
  },
  { icon: '📋', title: 'Forums', description: 'Discussions with karma system' },
  {
    icon: '🏆',
    title: 'Achievements',
    description: 'Earn XP, unlock titles, and climb leaderboards',
  },
  { icon: '🎨', title: 'Customization', description: 'Personalize your profile and chat bubbles' },
  { icon: '📞', title: 'Voice & Video', description: 'Crystal-clear calls with screen sharing' },
];

export const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    key: 'notifyMessages',
    label: 'Direct Messages',
    desc: 'New messages from friends',
  },
  {
    key: 'notifyMentions',
    label: 'Mentions',
    desc: 'When someone @mentions you',
  },
  {
    key: 'notifyFriendRequests',
    label: 'Friend Requests',
    desc: 'New friend requests',
  },
];

export const DEFAULT_PROFILE_DATA = {
  displayName: '',
  bio: '',
   
  avatarUrl: null as string | null, // type assertion: initial null value needs union type annotation
  notifyMessages: true,
  notifyMentions: true,
  notifyFriendRequests: true,
  theme: 'dark' as const,
};
