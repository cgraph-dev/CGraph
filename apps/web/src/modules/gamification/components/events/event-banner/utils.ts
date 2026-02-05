/**
 * Helper utilities for Event Banner system
 * @module modules/gamification/components/events/event-banner/utils
 */

import type { EventReward, BattlePassTier } from '@/stores/gamification';
import type { BattlePassTierExtended, DisplayReward } from './types';

/**
 * Icon mapping based on reward type
 */
export const REWARD_TYPE_ICONS: Record<EventReward['type'], string> = {
  coins: '🪙',
  gems: '💎',
  xp: '⭐',
  title: '🏷️',
  border: '🖼️',
  effect: '✨',
  badge: '🎖️',
};

/**
 * Event type to emoji mapping
 */
const EVENT_EMOJIS: Record<string, string> = {
  seasonal: '🎄',
  holiday: '🎉',
  anniversary: '🎂',
  competition: '🏆',
  community: '🤝',
  special: '✨',
  winter: '❄️',
  summer: '☀️',
  spring: '🌸',
  fall: '🍂',
  halloween: '🎃',
  christmas: '🎅',
  easter: '🐰',
  valentines: '💝',
};

/**
 * Get icon for a reward based on its type
 */
export function getRewardIcon(reward: EventReward): string {
  return REWARD_TYPE_ICONS[reward.type] || '🎁';
}

/**
 * Get emoji for an event type
 */
export function getEventEmoji(eventType: string): string {
  return EVENT_EMOJIS[eventType.toLowerCase()] || '🎮';
}

/**
 * Transform tiers into extended format with singular reward accessors
 */
export function normalizeTiers(tiers: BattlePassTier[]): BattlePassTierExtended[] {
  return tiers.map((tier, index) => {
    const freeReward = tier.freeRewards?.[0];
    const premiumReward = tier.premiumRewards?.[0];
    return {
      ...tier,
      id: index + 1,
      claimed: false,
      // Provide singular accessors with icon based on type
      freeReward: freeReward
        ? { ...freeReward, icon: getRewardIcon(freeReward) }
        : { id: '', name: 'Reward', type: 'xp' as const, icon: '🎁' },
      premiumReward: premiumReward
        ? { ...premiumReward, icon: getRewardIcon(premiumReward) }
        : { id: '', name: 'Premium Reward', type: 'gems' as const, icon: '⭐' },
    };
  });
}
