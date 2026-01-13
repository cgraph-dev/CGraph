/**
 * Gamification Service
 * 
 * Domain service for XP, achievements, and progression logic.
 */

import {
  AchievementEntity,
  UserAchievementEntity,
  QuestEntity,
  UserQuestEntity,
  StreakEntity,
  XP_REWARDS,
  calculateLevel,
  getStreakMultiplier,
} from '../entities/Gamification';

export interface XPGainResult {
  baseXP: number;
  multiplier: number;
  bonusXP: number;
  totalXP: number;
  newTotalXP: number;
  levelUp: boolean;
  newLevel: number;
  unlockedAchievements: string[];
}

export interface QuestProgressResult {
  questId: string;
  newProgress: number;
  isCompleted: boolean;
  justCompleted: boolean;
}

/**
 * Gamification Service for managing XP and progression
 */
export class GamificationService {
  /**
   * Award XP for an action
   */
  static awardXP(
    action: keyof typeof XP_REWARDS,
    currentTotalXP: number,
    streak?: StreakEntity
  ): XPGainResult {
    const baseXP = XP_REWARDS[action];
    const multiplier = streak ? getStreakMultiplier(streak.currentStreak) : 1.0;
    const bonusXP = Math.floor(baseXP * (multiplier - 1));
    const totalXP = baseXP + bonusXP;
    
    const previousLevel = calculateLevel(currentTotalXP);
    const newTotalXP = currentTotalXP + totalXP;
    const newLevelInfo = calculateLevel(newTotalXP);
    
    return {
      baseXP,
      multiplier,
      bonusXP,
      totalXP,
      newTotalXP,
      levelUp: newLevelInfo.level > previousLevel.level,
      newLevel: newLevelInfo.level,
      unlockedAchievements: [], // Filled by caller after checking achievements
    };
  }
  
  /**
   * Check if an achievement should be unlocked
   */
  static checkAchievementProgress(
    achievement: AchievementEntity,
    userAchievement: UserAchievementEntity,
    newProgress: number
  ): { shouldUnlock: boolean; progress: number } {
    if (userAchievement.isUnlocked) {
      return { shouldUnlock: false, progress: achievement.targetProgress };
    }
    
    const progress = Math.min(newProgress, achievement.targetProgress);
    const shouldUnlock = progress >= achievement.targetProgress;
    
    return { shouldUnlock, progress };
  }
  
  /**
   * Update quest progress
   */
  static updateQuestProgress(
    quest: QuestEntity,
    userQuest: UserQuestEntity,
    progressDelta: number
  ): QuestProgressResult {
    if (userQuest.isCompleted) {
      return {
        questId: quest.id,
        newProgress: quest.targetProgress,
        isCompleted: true,
        justCompleted: false,
      };
    }
    
    const newProgress = Math.min(
      userQuest.currentProgress + progressDelta,
      quest.targetProgress
    );
    const isCompleted = newProgress >= quest.targetProgress;
    const justCompleted = isCompleted && !userQuest.isCompleted;
    
    return {
      questId: quest.id,
      newProgress,
      isCompleted,
      justCompleted,
    };
  }
  
  /**
   * Calculate daily streak
   */
  static calculateStreak(
    currentStreak: StreakEntity,
    lastCheckIn: Date,
    now: Date = new Date()
  ): { newStreak: number; streakBroken: boolean; multiplier: number } {
    const lastCheckInDate = new Date(lastCheckIn);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Same day - no change
    if (lastCheckInDate.toDateString() === now.toDateString()) {
      return {
        newStreak: currentStreak.currentStreak,
        streakBroken: false,
        multiplier: getStreakMultiplier(currentStreak.currentStreak),
      };
    }
    
    // Yesterday - continue streak
    if (lastCheckInDate.toDateString() === yesterday.toDateString()) {
      const newStreak = currentStreak.currentStreak + 1;
      return {
        newStreak,
        streakBroken: false,
        multiplier: getStreakMultiplier(newStreak),
      };
    }
    
    // More than 1 day - streak broken
    return {
      newStreak: 1,
      streakBroken: true,
      multiplier: 1.0,
    };
  }
  
  /**
   * Get rewards for reaching a level
   */
  static getLevelRewards(level: number): {
    coins: number;
    title?: string;
    badge?: string;
  } {
    const rewards: { coins: number; title?: string; badge?: string } = {
      coins: level * 10, // Base coin reward
    };
    
    // Milestone rewards
    if (level % 10 === 0) {
      rewards.coins *= 5; // 5x coins at milestone levels
      rewards.badge = `level_${level}`;
    }
    
    // Title unlocks at specific levels
    const titleLevels: Record<number, string> = {
      5: 'Newcomer',
      10: 'Regular',
      25: 'Veteran',
      50: 'Elite',
      100: 'Legend',
    };
    
    if (titleLevels[level]) {
      rewards.title = titleLevels[level];
    }
    
    return rewards;
  }
  
  /**
   * Calculate leaderboard position
   */
  static calculateRank(
    userXP: number,
    allUserXPs: number[]
  ): { rank: number; percentile: number } {
    const sorted = [...allUserXPs].sort((a, b) => b - a);
    const rank = sorted.findIndex(xp => xp <= userXP) + 1;
    const percentile = ((sorted.length - rank) / sorted.length) * 100;
    
    return { rank, percentile };
  }
}
