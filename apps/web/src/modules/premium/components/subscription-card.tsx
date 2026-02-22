/**
 * SubscriptionCard Component
 *
 * Displays a subscription tier with features, pricing, and CTA.
 * Constants extracted to subscriptionCard.constants.tsx
 * Compact variant extracted to CompactSubscriptionCard.tsx
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import {
  TIER_ICONS,
  TIER_COLORS,
  TIER_GRADIENTS,
  Crown,
} from '@/modules/premium/components/subscriptionCard.constants';
import { CompactSubscriptionCard } from '@/modules/premium/components/compact-subscription-card';
import type { SubscriptionTier, SubscriptionPlan } from '@/modules/premium/store/types';

export interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  billingInterval?: 'monthly' | 'yearly';
  onSelect?: (tier: SubscriptionTier) => void;
  onCompare?: () => void;
  showFeatures?: boolean;
  maxFeatures?: number;
  className?: string;
}

export function SubscriptionCard({
  plan,
  isCurrentPlan = false,
  variant = 'default',
  billingInterval = 'monthly',
  onSelect,
  onCompare,
  showFeatures = true,
  maxFeatures = 8,
  className = '',
}: SubscriptionCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const price =
    billingInterval === 'yearly'
      ? (plan.priceYearly / 12).toFixed(2)
      : plan.priceMonthly.toFixed(2);

  const yearlyTotal = plan.priceYearly.toFixed(2);
  const monthlySavings =
    billingInterval === 'yearly'
      ? ((plan.priceMonthly * 12 - plan.priceYearly) / 12).toFixed(2)
      : null;

  const tierColor = TIER_COLORS[plan.tier];
  const tierGradient = TIER_GRADIENTS[plan.tier];
  const displayedFeatures = showFeatures ? plan.features.slice(0, maxFeatures) : [];

  const handleSelect = () => {
    HapticFeedback.medium();
    onSelect?.(plan.tier);
  };

  if (variant === 'compact') {
    return (
      <CompactSubscriptionCard
        plan={plan}
        isCurrentPlan={isCurrentPlan}
        billingInterval={billingInterval}
        onSelect={onSelect}
        className={className}
      />
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${className}`}
    >
      {/* Popular badge */}
      {plan.tier === 'premium' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2"
        >
          <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            Most Popular
          </span>
        </motion.div>
      )}

      {/* Best value badge */}
      {plan.tier === 'enterprise' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2"
        >
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Crown className="h-3 w-3" /> Best Value
          </span>
        </motion.div>
      )}

      <GlassCard
        variant={variant === 'featured' || plan.tier === 'premium' ? 'holographic' : 'frosted'}
        className={`relative overflow-hidden p-6 ${plan.tier === 'premium' ? 'ring-2 ring-purple-500/50' : ''} ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''} `}
      >
        {/* Animated background */}
        <AnimatePresence>
          {isHovered && plan.tier !== 'free' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-gradient-to-br ${tierGradient}`}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="relative mb-6 text-center">
          <motion.div
            animate={{
              rotate: isHovered ? [0, -10, 10, 0] : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br p-4 ${tierGradient} text-white`}
          >
            {TIER_ICONS[plan.tier]}
          </motion.div>

          <h3 className="mb-1 text-xl font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-white/60">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="mb-6 text-center">
          {plan.priceMonthly === 0 ? (
            <div className="text-4xl font-bold text-white">Free</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">${price}</span>
                <span className="text-white/60">/month</span>
              </div>
              {billingInterval === 'yearly' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 space-y-1"
                >
                  <div className="text-sm text-white/60">${yearlyTotal} billed yearly</div>
                  {monthlySavings && parseFloat(monthlySavings) > 0 && (
                    <div className="text-sm font-medium text-green-400">
                      Save ${monthlySavings}/month
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Features */}
        {showFeatures && displayedFeatures.length > 0 && (
          <ul className="mb-6 space-y-3">
            {displayedFeatures.map((feature, index) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2"
              >
                <CheckIcon className={`h-5 w-5 flex-shrink-0 text-${tierColor}-400`} />
                <span className="text-sm text-white/80">{feature}</span>
              </motion.li>
            ))}
            {plan.features.length > maxFeatures && (
              <li className="pl-7 text-sm text-white/60">
                +{plan.features.length - maxFeatures} more features
              </li>
            )}
          </ul>
        )}

        {/* Limits summary */}
        <div className="mb-6 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <div className="text-white/60">Groups</div>
            <div className="font-semibold text-white">
              {plan.limits.maxGroups === -1 ? 'Unlimited' : plan.limits.maxGroups}
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <div className="text-white/60">Storage</div>
            <div className="font-semibold text-white">{plan.limits.maxStorageGB}GB</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <div className="text-white/60">File Size</div>
            <div className="font-semibold text-white">{plan.limits.maxFileSize}MB</div>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <div className="text-white/60">Emojis</div>
            <div className="font-semibold text-white">
              {plan.limits.customEmojis === -1 ? '∞' : plan.limits.customEmojis}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleSelect}
          disabled={isCurrentPlan && plan.tier !== 'free'}
          className={`w-full rounded-xl py-3 font-semibold ${
            isCurrentPlan
              ? 'cursor-default bg-white/10 text-white/60'
              : `bg-gradient-to-r ${tierGradient} text-white hover:opacity-90`
          } `}
        >
          {isCurrentPlan
            ? 'Current Plan'
            : plan.priceMonthly === 0
              ? 'Get Started'
              : 'Subscribe Now'}
        </Button>

        {/* Compare link */}
        {onCompare && (
          <button
            onClick={onCompare}
            className="mt-3 w-full text-sm text-white/60 transition-colors hover:text-white"
          >
            Compare all features →
          </button>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default SubscriptionCard;
