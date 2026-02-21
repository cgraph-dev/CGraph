/**
 * CompactSubscriptionCard
 *
 * A condensed variant of the SubscriptionCard, used when
 * `variant="compact"` is passed to SubscriptionCard.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  TIER_ICONS,
  TIER_GRADIENTS,
} from '@/modules/premium/components/subscriptionCard.constants';
import type { SubscriptionCardProps } from '@/modules/premium/components/SubscriptionCard';

export function CompactSubscriptionCard({ plan, isCurrentPlan = false, billingInterval = 'monthly', onSelect, className = '' }: Pick<
  SubscriptionCardProps,
  'plan' | 'isCurrentPlan' | 'billingInterval' | 'onSelect' | 'className'
>): React.ReactElement {
  const tierGradient = TIER_GRADIENTS[plan.tier];

  const price =
    billingInterval === 'yearly'
      ? (plan.priceYearly / 12).toFixed(2)
      : plan.priceMonthly.toFixed(2);

  const handleSelect = () => {
    HapticFeedback.medium();
    onSelect?.(plan.tier);
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={className}>
      <GlassCard
        variant={isCurrentPlan ? 'neon' : 'frosted'}
        className={`cursor-pointer p-4 ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''}`}
        onClick={handleSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg bg-gradient-to-br p-2 ${tierGradient} text-white`}>
              {TIER_ICONS[plan.tier]}
            </div>
            <div>
              <h3 className="font-semibold text-white">{plan.name}</h3>
              <p className="text-sm text-white/60">{plan.description}</p>
            </div>
          </div>
          <div className="text-right">
            {plan.priceMonthly === 0 ? (
              <span className="text-lg font-bold text-white">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-white">${price}</span>
                <span className="text-sm text-white/60">/mo</span>
              </>
            )}
          </div>
        </div>
        {isCurrentPlan && (
          <div className="mt-2 text-xs font-medium text-primary-400">✓ Current Plan</div>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default CompactSubscriptionCard;
