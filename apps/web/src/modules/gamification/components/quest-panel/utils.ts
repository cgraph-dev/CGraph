import type { Quest } from '@/stores/gamificationStore';
import type { QuestTypeColor } from './types';

/** Format time remaining from an expiry date string to a human-readable countdown */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

/** Returns color classes for quest types (daily/weekly/monthly/special) */
export function getQuestTypeColor(type: string): QuestTypeColor {
  switch (type) {
    case 'daily':
      return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' };
    case 'weekly':
      return { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' };
    case 'monthly':
      return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' };
    case 'special':
      return { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-400' };
    default:
      return { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' };
  }
}

/** Checks if all objectives are complete */
export function isQuestReady(quest: Quest): boolean {
  return quest.objectives.every((obj) => obj.completed);
}

/** Calculates percentage progress across all objectives */
export function getQuestProgress(quest: Quest): number {
  if (quest.objectives.length === 0) return 0;
  const totalProgress = quest.objectives.reduce((sum, obj) => {
    return sum + obj.currentValue / obj.targetValue;
  }, 0);
  return Math.min((totalProgress / quest.objectives.length) * 100, 100);
}
