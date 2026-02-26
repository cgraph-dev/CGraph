/**
 * NotificationsInbox Types and Constants
 */

import { Ionicons } from '@expo/vector-icons';

export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'friend_accepted'
  | 'mention'
  | 'group_invite'
  | 'forum_reply'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export type TabType = 'all' | 'unread' | 'messages' | 'mentions' | 'system';

export const typeIcons: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble',
  friend_request: 'person-add',
  friend_accepted: 'people',
  mention: 'at',
  group_invite: 'people-circle',
  forum_reply: 'chatbubbles',
  system: 'shield-checkmark',
};

export const typeGradients: Record<NotificationType, [string, string]> = {
  message: ['#3b82f6', '#06b6d4'],
  friend_request: ['#10b981', '#34d399'],
  friend_accepted: ['#10b981', '#059669'],
  mention: ['#f59e0b', '#fbbf24'],
  group_invite: ['#8b5cf6', '#a855f7'],
  forum_reply: ['#06b6d4', '#22d3ee'],
  system: ['#6366f1', '#818cf8'],
};

export const tabs: { id: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'notifications' },
  { id: 'unread', label: 'Unread', icon: 'radio-button-on' },
  { id: 'messages', label: 'Messages', icon: 'chatbubble' },
  { id: 'mentions', label: 'Mentions', icon: 'at' },
  { id: 'system', label: 'System', icon: 'shield-checkmark' },
];

/**
 *
 */
export function getMockNotifications(): Notification[] {
  return [
    {
      id: '1',
      type: 'message',
      title: 'New message from John Doe',
      body: 'Hey, are you coming to the meeting today?',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      sender: { id: '1', username: 'johndoe', avatarUrl: 'https://i.pravatar.cc/150?u=johndoe' },
      data: { conversationId: '1' },
    },
    {
      id: '2',
      type: 'friend_request',
      title: 'Friend request',
      body: 'Jane Smith wants to be your friend',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: {
        id: '2',
        username: 'janesmith',
        avatarUrl: 'https://i.pravatar.cc/150?u=janesmith',
      },
    },
    {
      id: '3',
      type: 'mention',
      title: 'You were mentioned',
      body: '@you in General: Check out this new feature!',
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: { id: '3', username: 'dev_team', avatarUrl: 'https://i.pravatar.cc/150?u=devteam' },
    },
    {
      id: '4',
      type: 'group_invite',
      title: 'Group invitation',
      body: 'You have been invited to join "React Developers"',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      data: { groupId: '1', channelId: '1' },
    },
    {
      id: '5',
      type: 'system',
      title: 'Security alert',
      body: 'New login detected from Chrome on Windows',
      read: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
