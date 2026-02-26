/**
 * Premium tier badge component.
 * @module
 */
import { tierConfig, type PremiumTier } from './tier-config';

/**
 * unknown for the theme module.
 */
/**
 * Tier Badge component.
 */
export function TierBadge({ tier }: { tier: PremiumTier }) {
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${config.bgColor}`}>
      {TierIcon && <TierIcon className="h-3 w-3 text-white" />}
      <span className="text-xs font-medium text-white">{config.label}</span>
    </div>
  );
}
