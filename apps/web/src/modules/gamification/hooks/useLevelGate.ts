/**
 * useLevelGate Hook — Progressive Disclosure
 *
 * Checks whether a feature is unlocked for the current user based on
 * their gamification level. Uses the gamification store for the user's
 * current level and the shared FEATURE_REQUIREMENTS constant.
 *
 * @module modules/gamification/hooks/useLevelGate
 */

import { useMemo } from 'react';
import { useGamificationStore } from '../store';
import {
  FEATURE_REQUIREMENTS,
  FEATURE_DISPLAY_NAMES,
  type FeatureGateKey,
} from '@cgraph/shared-types';

export interface LevelGateResult {
  /** Whether the feature is unlocked for the current user */
  unlocked: boolean;
  /** The level required to unlock this feature */
  requiredLevel: number;
  /** The user's current level */
  currentLevel: number;
  /** Progress toward unlocking (0–100) */
  progressPercent: number;
  /** Human-readable feature display name */
  featureName: string;
}

/**
 * Hook that checks if a feature is unlocked for the current user.
 *
 * @example
 * ```tsx
 * const { unlocked, requiredLevel, progressPercent } = useLevelGate('marketplace');
 * if (!unlocked) return <LockedState level={requiredLevel} />;
 * ```
 */
export function useLevelGate(feature: FeatureGateKey): LevelGateResult {
  const level = useGamificationStore((s) => s.level);

  return useMemo(() => {
    const requiredLevel = FEATURE_REQUIREMENTS[feature] ?? 1;
    const unlocked = level >= requiredLevel;
    const progressPercent = unlocked
      ? 100
      : Math.min(Math.round((level / requiredLevel) * 100), 99);
    const featureName = FEATURE_DISPLAY_NAMES[feature] ?? feature;

    return {
      unlocked,
      requiredLevel,
      currentLevel: level,
      progressPercent,
      featureName,
    };
  }, [feature, level]);
}

/**
 * Compute which features were newly unlocked between two levels.
 * Useful for triggering unlock celebrations on level-up.
 */
export function getNewlyUnlockedFeatures(
  oldLevel: number,
  newLevel: number,
): FeatureGateKey[] {
  if (newLevel <= oldLevel) return [];

  return (Object.entries(FEATURE_REQUIREMENTS) as [FeatureGateKey, number][])
    .filter(([, req]) => oldLevel < req && newLevel >= req)
    .map(([feature]) => feature);
}
