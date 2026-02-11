import type { DemoTab } from './types';

export const DEMO_TABS: DemoTab[] = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'customize', label: 'Customize', icon: '✨' },
  { id: 'gamify', label: 'Gamification', icon: '🎮' },
];

export const DEMO_MESSAGES: Array<{
  author: string;
  avatar: string;
  content: string;
  reactions?: { emoji: string; count: number }[];
}> = [
  {
    author: 'Alex',
    avatar: '🦊',
    content: 'Hey everyone! Just hit level 50! 🎉',
    reactions: [
      { emoji: '🔥', count: 12 },
      { emoji: '👏', count: 8 },
    ],
  },
  {
    author: 'Jordan',
    avatar: '🐺',
    content: 'Congrats! That new avatar border looks amazing',
    reactions: [{ emoji: '💜', count: 5 }],
  },
  {
    author: 'Sam',
    avatar: '🦁',
    content: "The E2E encryption here is chef's kiss 👨‍🍳",
    reactions: [{ emoji: '🔒', count: 15 }],
  },
];

export const AVATAR_BORDERS = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'gold', name: 'Gold', style: 'linear-gradient(135deg, #ffd700, #ff8c00)' },
  { id: 'emerald', name: 'Emerald', style: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: 'purple', name: 'Royal', style: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  {
    id: 'rainbow',
    name: 'Rainbow',
    style: 'linear-gradient(135deg, #ff0080, #7928ca, #0070f3, #00dfd8)',
  },
];

export const ACHIEVEMENTS = [
  { id: 'first-message', name: 'First Steps', icon: '🌟', desc: 'Send your first message' },
  { id: 'social', name: 'Social Butterfly', icon: '🦋', desc: 'Make 10 friends' },
  { id: 'streaker', name: 'Dedicated', icon: '🔥', desc: '7-day login streak' },
  { id: 'legend', name: 'Legend', icon: '👑', desc: 'Reach level 100' },
];
