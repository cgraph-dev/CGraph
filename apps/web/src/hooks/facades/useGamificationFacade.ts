/**
 * Gamification Facade Hook
 *
 * Discord-style composition hook that aggregates XP, achievements,
 * prestige, seasonal events, and referrals into a single progression interface.
 *
 * @example
 * ```tsx
 * const {
 *   level, xp, achievements, quests,
 *   prestigeLevel, activeEvents,
 *   equipTitle, claimQuest,
 * } = useGamificationFacade();
 * ```
 *
 * @module hooks/facades/useGamificationFacade
 */

import { useMemo } from 'react';
import {
  useGamificationStore,
  usePrestigeStore,
  useSeasonalEventStore,
  useReferralStore,
  type Achievement,
  type Quest,
  type UserTitle,
  type SeasonalEvent,
} from '@/modules/gamification/store';

export interface GamificationFacade {
  // Core progression
  level: number;
  currentXP: number;
  totalXP: number;
  karma: number;
  loginStreak: number;
  isLoading: boolean;

  // Achievements
  achievements: Achievement[];
  recentlyUnlocked: Achievement[];
  equippedBadges: string[];

  // Quests
  activeQuests: Quest[];
  completedQuests: Quest[];

  // Titles
  equippedTitle: UserTitle | null;
  availableTitles: UserTitle[];

  // Prestige
  prestigeLevel: number;
  canPrestige: boolean;

  // Events
  activeEvents: SeasonalEvent[];
  featuredEvent: SeasonalEvent | null;

  // Referrals
  referralCode: string | null;
  referralUrl: string | null;
  referralCount: number;

  // Actions
  fetchGamificationData: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchQuests: () => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  equipTitle: (titleId: string) => Promise<void>;
  equipBadge: (badgeId: string) => Promise<void>;
  unequipBadge: (badgeId: string) => Promise<void>;
}

/**
 * Composes all gamification state into a single facade.
 */
export function useGamificationFacade(): GamificationFacade {
  // Core gamification
  const level = useGamificationStore((s) => s.level);
  const currentXP = useGamificationStore((s) => s.currentXP);
  const totalXP = useGamificationStore((s) => s.totalXP);
  const karma = useGamificationStore((s) => s.karma);
  const loginStreak = useGamificationStore((s) => s.loginStreak);
  const isLoading = useGamificationStore((s) => s.isLoading);
  const achievements = useGamificationStore((s) => s.achievements);
  const recentlyUnlocked = useGamificationStore((s) => s.recentlyUnlocked);
  const equippedBadges = useGamificationStore((s) => s.equippedBadges);
  const activeQuests = useGamificationStore((s) => s.activeQuests);
  const completedQuests = useGamificationStore((s) => s.completedQuests);
  const equippedTitle = useGamificationStore((s) => s.equippedTitle);
  const availableTitles = useGamificationStore((s) => s.availableTitles);
  const fetchGamificationData = useGamificationStore((s) => s.fetchGamificationData);
  const fetchAchievements = useGamificationStore((s) => s.fetchAchievements);
  const fetchQuests = useGamificationStore((s) => s.fetchQuests);
  const completeQuest = useGamificationStore((s) => s.completeQuest);
  const equipTitle = useGamificationStore((s) => s.equipTitle);
  const equipBadge = useGamificationStore((s) => s.equipBadge);
  const unequipBadge = useGamificationStore((s) => s.unequipBadge);

  // Prestige
  const prestige = usePrestigeStore((s) => s.prestige);
  const prestigeLevel = prestige?.level ?? 0;
  const canPrestige = usePrestigeStore((s) => s.canPrestige);

  // Events
  const activeEvents = useSeasonalEventStore((s) => s.activeEvents);
  const featuredEvent = useSeasonalEventStore((s) => s.featuredEvent);

  // Referrals
  const referralCodeObj = useReferralStore((s) => s.referralCode);
  const referralStats = useReferralStore((s) => s.stats);
  const referralCode = referralCodeObj?.code ?? null;
  const referralUrl = referralCodeObj?.url ?? null;
  const referralCount = referralStats?.totalReferrals ?? 0;

  return useMemo(
    () => ({
      level,
      currentXP,
      totalXP,
      karma,
      loginStreak,
      isLoading,
      achievements,
      recentlyUnlocked,
      equippedBadges,
      activeQuests,
      completedQuests,
      equippedTitle,
      availableTitles,
      prestigeLevel,
      canPrestige,
      activeEvents,
      featuredEvent,
      referralCode,
      referralUrl,
      referralCount,
      fetchGamificationData,
      fetchAchievements,
      fetchQuests,
      completeQuest,
      equipTitle,
      equipBadge,
      unequipBadge,
    }),
    [
      level,
      currentXP,
      totalXP,
      karma,
      loginStreak,
      isLoading,
      achievements,
      recentlyUnlocked,
      equippedBadges,
      activeQuests,
      completedQuests,
      equippedTitle,
      availableTitles,
      prestigeLevel,
      canPrestige,
      activeEvents,
      featuredEvent,
      referralCode,
      referralUrl,
      referralCount,
      fetchGamificationData,
      fetchAchievements,
      fetchQuests,
      completeQuest,
      equipTitle,
      equipBadge,
      unequipBadge,
    ]
  );
}
