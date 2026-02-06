/**
 * Type definitions for Onboarding module
 */

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface ProfileData {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  notifyMessages: boolean;
  notifyMentions: boolean;
  notifyFriendRequests: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export type ProfileUpdatePayload = {
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
};

export type NotificationKey = 'notifyMessages' | 'notifyMentions' | 'notifyFriendRequests';

export interface NotificationOption {
  key: NotificationKey;
  label: string;
  desc: string;
}
