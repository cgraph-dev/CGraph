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
    title: 'Stay Connected',
    description: 'Choose how you want to be notified',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    id: 4,
    title: "You're All Set!",
    description: 'Explore the features that make CGraph special',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
    description: 'Create communities with Discord-style servers',
  },
  { icon: '📋', title: 'Forums', description: 'Reddit-style discussions with karma system' },
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
  avatarUrl: null as string | null,
  notifyMessages: true,
  notifyMentions: true,
  notifyFriendRequests: true,
  theme: 'dark' as const,
};
