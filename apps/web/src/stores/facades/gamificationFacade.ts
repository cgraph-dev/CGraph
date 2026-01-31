/**
 * Gamification Facade
 *
 * Unified interface for XP, achievements, and progression.
 * Aggregates: gamificationStore, prestigeStore, seasonalEventStore, referralStore
 *
 * @module stores/facades/gamificationFacade
 */

import { useGamificationStore } from '../gamificationStore';
import { usePrestigeStore } from '../prestigeStore';
import { useSeasonalEventStore } from '../seasonalEventStore';
import { useReferralStore } from '../referralStore';

/**
 * Unified gamification and progression facade
 * Provides a single hook for all gamification-related state and actions
 */
export function useGamificationFacade() {
  const gamification = useGamificationStore();
  const prestige = usePrestigeStore();
  const events = useSeasonalEventStore();
  const referrals = useReferralStore();

  return {
    // === XP & Level State ===
    level: gamification.level,
    currentXP: gamification.currentXP,
    totalXP: gamification.totalXP,
    xp: gamification.xp,
    karma: gamification.karma,
    loginStreak: gamification.loginStreak,

    // === Achievements State ===
    achievements: gamification.achievements,
    recentlyUnlocked: gamification.recentlyUnlocked,

    // === Quests State ===
    activeQuests: gamification.activeQuests,
    completedQuests: gamification.completedQuests,

    // === Titles State ===
    availableTitles: gamification.availableTitles,
    equippedTitle: gamification.equippedTitle,
    equippedBadges: gamification.equippedBadges,

    // === Gamification Actions ===
    fetchGamificationData: gamification.fetchGamificationData,
    fetchAchievements: gamification.fetchAchievements,
    fetchQuests: gamification.fetchQuests,
    addXP: gamification.addXP,
    unlockAchievement: gamification.unlockAchievement,
    completeQuest: gamification.completeQuest,
    equipTitle: gamification.equipTitle,
    equipBadge: gamification.equipBadge,
    unequipBadge: gamification.unequipBadge,
    checkDailyLogin: gamification.checkDailyLogin,

    // === Prestige State ===
    prestigeData: prestige.prestige,
    prestigeRequirements: prestige.requirements,
    canPrestige: prestige.canPrestige,
    prestigeLeaderboard: prestige.leaderboard,
    isPrestiging: prestige.isPrestiging,

    // === Prestige Actions ===
    fetchPrestige: prestige.fetchPrestige,
    performPrestige: prestige.performPrestige,
    getProgressPercent: prestige.getProgressPercent,
    getXpWithBonus: prestige.getXpWithBonus,

    // === Seasonal Events State ===
    activeEvents: events.activeEvents,
    featuredEvent: events.featuredEvent,
    currentEvent: events.currentEvent,
    currentProgress: events.currentProgress,
    eventLeaderboard: events.leaderboard,
    eventIsLoading: events.isLoading,

    // === Seasonal Events Actions ===
    fetchEvents: events.fetchEvents,
    fetchEventDetails: events.fetchEventDetails,
    joinEvent: events.joinEvent,
    claimEventReward: events.claimReward,

    // === Referrals State ===
    referralCode: referrals.referralCode,
    referralStats: referrals.stats,
    referrals: referrals.referrals,

    // === Referrals Actions ===
    fetchReferralCode: referrals.fetchReferralCode,
    regenerateReferralCode: referrals.regenerateCode,
    claimReferralReward: referrals.claimReward,

    // === Direct Store Access (for edge cases) ===
    _stores: { gamification, prestige, events, referrals },
  };
}

export type GamificationFacade = ReturnType<typeof useGamificationFacade>;
