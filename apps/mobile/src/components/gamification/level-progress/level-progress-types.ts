/**
 * Level progress shared types and XP calculation utilities.
 * @module components/gamification/level-progress/level-progress-types
 */

// =============================================================================
// TYPES
// =============================================================================

export interface LevelProgressProps {
  level?: number;
  currentXP?: number;
  totalXP?: number;
  loginStreak?: number;
  variant?: 'compact' | 'expanded';
  compact?: boolean;
  showStreak?: boolean;
  showXPGain?: boolean;
  onLevelUp?: (level: number) => void;
  onPress?: () => void;
  className?: string;
}

export interface XPGainNotification {
  id: string;
  amount: number;
  timestamp: number;
}

// =============================================================================
// XP CALCULATIONS
// =============================================================================

export function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.5;
  if (streak >= 7) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

export function getStreakColor(streak: number): string {
  if (streak >= 30) return '#ec4899'; // Pink - legendary
  if (streak >= 14) return '#8b5cf6'; // Purple - epic
  if (streak >= 7) return '#f59e0b'; // Gold
  if (streak >= 3) return '#f97316'; // Orange
  return '#6b7280'; // Gray
}
