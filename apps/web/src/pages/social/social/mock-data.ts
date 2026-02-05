/**
 * Social Hub - Mock Data
 */

import type { Notification, SearchResult } from './types';

// =============================================================================
// MOCK NOTIFICATIONS
// =============================================================================

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif1',
    type: 'friend_request',
    title: 'New Friend Request',
    message: 'John Doe sent you a friend request',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 'notif2',
    type: 'message',
    title: 'New Message',
    message: 'Sarah: Hey, are you free tonight?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/messages/conv123',
  },
  {
    id: 'notif3',
    type: 'forum_reply',
    title: 'Forum Reply',
    message: 'Alex replied to your post in Gaming',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/forums/gaming/post123',
  },
  {
    id: 'notif4',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'You unlocked "Social Butterfly" - Made 10 friends',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 'notif5',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Mike mentioned you in #general',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionUrl: '/groups/server123/general',
  },
];

// =============================================================================
// MOCK SEARCH RESULTS
// =============================================================================

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    id: 'user1',
    type: 'user',
    name: 'Gaming Legend',
    description: '@gaminglegend • Level 42',
  },
  {
    id: 'forum1',
    type: 'forum',
    name: 'Gaming Discussions',
    description: 'Talk about your favorite games',
    memberCount: 15420,
    isJoined: true,
  },
  {
    id: 'group1',
    type: 'group',
    name: 'Valorant Squad',
    description: 'Competitive Valorant players',
    memberCount: 847,
    isJoined: false,
  },
  {
    id: 'user2',
    type: 'user',
    name: 'Pro Gamer',
    description: '@progamer • Level 40',
  },
  {
    id: 'forum2',
    type: 'forum',
    name: 'Tech Talk',
    description: 'Technology and programming',
    memberCount: 23100,
    isJoined: false,
  },
];
