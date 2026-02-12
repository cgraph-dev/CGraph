import type { DemoTab, DemoUserProfile } from './types';

export const DEMO_TABS: DemoTab[] = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'customize', label: 'Customize', icon: '✨' },
  { id: 'gamify', label: 'Gamification', icon: '🎮' },
];

/** Rich user profiles for the chat demo — showcases avatar borders, titles, badges */
export const DEMO_USER_PROFILES: Record<string, DemoUserProfile> = {
  Alex: {
    level: 50,
    title: 'Speed Demon',
    titleColor: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    borderStyle: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
    borderType: 'legendary',
    bubbleAccent: 'rgba(255, 215, 0, 0.08)',
    nameColor: '#f59e0b',
    badges: [
      { icon: '🔥', label: 'On Fire' },
      { icon: '👑', label: 'Founder' },
    ],
    xp: 4200,
    maxXp: 5000,
    karma: 1847,
    streak: 42,
  },
  Jordan: {
    level: 32,
    title: 'Community Builder',
    titleColor: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    borderStyle: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #8b5cf6)',
    borderType: 'electric',
    bubbleAccent: 'rgba(139, 92, 246, 0.08)',
    nameColor: '#a78bfa',
    badges: [
      { icon: '💎', label: 'Premium' },
      { icon: '🦋', label: 'Social' },
    ],
    xp: 2100,
    maxXp: 3500,
    karma: 923,
    streak: 18,
  },
  Sam: {
    level: 78,
    title: 'Crypto Pioneer',
    titleColor: 'linear-gradient(135deg, #10b981, #06b6d4)',
    borderStyle: 'linear-gradient(135deg, #10b981, #f97316, #10b981)',
    borderType: 'fire',
    bubbleAccent: 'rgba(16, 185, 129, 0.08)',
    nameColor: '#34d399',
    badges: [
      { icon: '⚡', label: 'Elite' },
      { icon: '🔒', label: 'Verified' },
      { icon: '🌐', label: 'Web3' },
    ],
    xp: 7800,
    maxXp: 8500,
    karma: 3241,
    streak: 67,
  },
};

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
