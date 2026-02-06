/**
 * ProfilePreview Constants
 */

import type { MockBadge } from './types';

/**
 * Mock badges for demo display
 */
export const MOCK_BADGES: MockBadge[] = [
  {
    id: '1',
    emoji: '🛡️',
    name: 'Guardian Shield',
    rarity: 'legendary',
    description: 'Protected 1000+ users',
    theme: 'defensive',
  },
  {
    id: '2',
    emoji: '⚔️',
    name: 'Blade Master',
    rarity: 'epic',
    description: 'Top 100 Contributors',
    theme: 'combat',
  },
  {
    id: '3',
    emoji: '🎩',
    name: 'Arcane Sage',
    rarity: 'mythic',
    description: 'Answered 500+ questions',
    theme: 'magic',
  },
  {
    id: '4',
    emoji: '👑',
    name: 'Royal Crown',
    rarity: 'legendary',
    description: 'Community Leader',
    theme: 'prestige',
  },
];

/**
 * Get glow color based on badge rarity
 */
export function getBadgeGlow(rarity: string): string {
  switch (rarity) {
    case 'mythic':
      return '#ec4899'; // Pink for mythic
    case 'legendary':
      return '#f59e0b'; // Gold for legendary
    case 'epic':
      return '#8b5cf6'; // Purple for epic
    case 'rare':
      return '#3b82f6'; // Blue for rare
    case 'uncommon':
      return '#10b981'; // Green for uncommon
    default:
      return '#6b7280'; // Gray for common
  }
}
