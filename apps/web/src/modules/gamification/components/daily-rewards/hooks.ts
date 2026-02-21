/**
 * DailyRewards Hooks
 *
 * Custom hooks for daily rewards functionality
 */

import { useState, useMemo } from 'react';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import type { DailyReward } from './types';
import { DEFAULT_REWARDS } from './constants';

/**
 * Hook to calculate and display countdown to next claim
 */
export function useTimeUntilClaim(nextClaimTime?: Date): string {
  const [timeUntilClaim, setTimeUntilClaim] = useState('');

  const updateTime = () => {
    if (!nextClaimTime) return;
    const now = new Date();
    const diff = nextClaimTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeUntilClaim('Ready to claim!');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilClaim(`${hours}h ${minutes}m ${seconds}s`);
  };

  useAdaptiveInterval(updateTime, 1000, { enabled: !!nextClaimTime, immediate: true });

  return timeUntilClaim;
}

/**
 * Hook to get today's reward from the rewards array
 */
export function useTodayReward(rewards: DailyReward[], currentDay: number): DailyReward {
  return useMemo((): DailyReward => {
    const effectiveRewards = rewards.length > 0 ? rewards : DEFAULT_REWARDS;
    const found = effectiveRewards.find((r) => r.day === currentDay);
    return found ?? effectiveRewards[0] ?? { day: 1, xp: 50, coins: 10 };
  }, [rewards, currentDay]);
}
