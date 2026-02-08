/**
 * Constants and types for Email Notification Settings.
 */

export interface EmailPreferences {
  emailNotificationsEnabled: boolean;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'monthly';
  emailOnNewMessage: boolean;
  emailOnFriendRequest: boolean;
  emailOnMention: boolean;
  emailOnReply: boolean;
  emailOnAchievement: boolean;
}

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  emailNotificationsEnabled: true,
  emailDigestEnabled: true,
  emailDigestFrequency: 'weekly',
  emailOnNewMessage: true,
  emailOnFriendRequest: true,
  emailOnMention: true,
  emailOnReply: true,
  emailOnAchievement: false,
};

export const DIGEST_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export interface NotificationTriggerItem {
  key: keyof EmailPreferences;
  icon: string;
  title: string;
  description: string;
}

export const NOTIFICATION_TRIGGERS: NotificationTriggerItem[] = [
  {
    key: 'emailOnNewMessage',
    icon: '💬',
    title: 'New Messages',
    description: 'When you receive a new direct message',
  },
  {
    key: 'emailOnFriendRequest',
    icon: '👥',
    title: 'Friend Requests',
    description: 'When someone sends you a friend request',
  },
  {
    key: 'emailOnMention',
    icon: '@',
    title: 'Mentions',
    description: 'When someone mentions you in a post or comment',
  },
  {
    key: 'emailOnReply',
    icon: '💬',
    title: 'Replies',
    description: 'When someone replies to your post or comment',
  },
  {
    key: 'emailOnAchievement',
    icon: '🏆',
    title: 'Achievements',
    description: 'When you unlock a new achievement',
  },
];
