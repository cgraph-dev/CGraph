/**
 * LevelGate Component — Progressive Disclosure
 *
 * Wrapper that renders children when the feature is unlocked,
 * or a locked state with level requirement and progress bar
 * when the user hasn't reached the required level.
 *
 * @module modules/gamification/components/level-gate
 */

import type { ReactNode } from 'react';
import { useLevelGate } from '../../hooks/useLevelGate';
import type { FeatureGateKey } from '@cgraph/shared-types';
import './level-gate.css';

interface LevelGateProps {
  /** The feature to gate */
  feature: FeatureGateKey;
  /** Content to render when unlocked */
  children: ReactNode;
  /** Custom locked state (replaces default) */
  fallback?: ReactNode;
  /** Show blurred preview of locked content */
  showPreview?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Progressive disclosure gate component.
 *
 * Renders children if the user's level meets the feature requirement.
 * Otherwise shows a locked overlay with level info and progress bar.
 *
 * @example
 * ```tsx
 * <LevelGate feature="marketplace">
 *   <MarketplaceContent />
 * </LevelGate>
 * ```
 */
export function LevelGate({
  feature,
  children,
  fallback,
  showPreview = false,
  compact = false,
}: LevelGateProps) {
  const { unlocked, requiredLevel, currentLevel, progressPercent, featureName } =
    useLevelGate(feature);

  if (unlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={`level-gate ${compact ? 'level-gate--compact' : ''}`}>
      {showPreview && (
        <div className="level-gate__preview" aria-hidden="true">
          {children}
        </div>
      )}
      <div className="level-gate__overlay" role="status" aria-label={`Feature locked: ${featureName}`}>
        <div className="level-gate__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="level-gate__lock"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="level-gate__title">Reach Level {requiredLevel} to unlock</h3>
        <p className="level-gate__feature-name">{featureName}</p>
        <div className="level-gate__progress">
          <div className="level-gate__progress-bar">
            <div
              className="level-gate__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="level-gate__progress-text">
            Level {currentLevel} / {requiredLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
