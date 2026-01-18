/**
 * SubscriptionCard Component
 *
 * Displays a subscription tier with features, pricing, and CTA.
 * Features:
 * - Multiple variants (default, compact, featured)
 * - Animated hover effects
 * - Feature list with icons
 * - Price display with billing toggle
 * - Popular/recommended badges
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  RocketLaunchIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { SubscriptionTier, SubscriptionPlan } from '@/features/premium/stores/types';

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

const TIER_ICONS: Record<SubscriptionTier, React.ReactNode> = {
  free: <StarIcon className="h-6 w-6" />,
  plus: <BoltIcon className="h-6 w-6" />,
  pro: <SparklesIcon className="h-6 w-6" />,
  ultimate: <RocketLaunchIcon className="h-6 w-6" />,
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'gray',
  plus: 'blue',
  pro: 'purple',
  ultimate: 'amber',
};

const TIER_GRADIENTS: Record<SubscriptionTier, string> = {
  free: 'from-gray-500 to-gray-600',
  plus: 'from-blue-500 to-cyan-500',
  pro: 'from-purple-500 to-pink-500',
  ultimate: 'from-amber-500 to-orange-600',
};

const Crown: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 0v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
  </svg>
);

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  isCurrentPlan = false,
  variant = 'default',
  billingInterval = 'monthly',
  onSelect,
  onCompare,
  showFeatures = true,
  maxFeatures = 8,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const price = billingInterval === 'yearly' 
    ? (plan.priceYearly / 12).toFixed(2)
    : plan.priceMonthly.toFixed(2);
  
  const yearlyTotal = plan.priceYearly.toFixed(2);
  const monthlySavings = billingInterval === 'yearly' 
    ? ((plan.priceMonthly * 12 - plan.priceYearly) / 12).toFixed(2)
    : null;

  const tierColor = TIER_COLORS[plan.tier];
  const tierGradient = TIER_GRADIENTS[plan.tier];
  const displayedFeatures = showFeatures 
    ? plan.features.slice(0, maxFeatures)
    : [];

  const handleSelect = () => {
    HapticFeedback.medium();
    onSelect?.(plan.tier);
  };

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={className}
      >
        <GlassCard
          variant={isCurrentPlan ? 'neon' : 'frosted'}
          className={`p-4 cursor-pointer ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''}`}
          onClick={handleSelect}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${tierGradient} text-white`}>
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
            <div className="mt-2 text-xs text-primary-400 font-medium">
              ✓ Current Plan
            </div>
          )}
        </GlassCard>
      </motion.div>
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
      {plan.tier === 'pro' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
            Most Popular
          </span>
        </motion.div>
      )}

      {/* Best value badge */}
      {plan.tier === 'ultimate' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
            <Crown className="h-3 w-3" /> Best Value
          </span>
        </motion.div>
      )}

      <GlassCard
        variant={variant === 'featured' || plan.tier === 'pro' ? 'holographic' : 'frosted'}
        className={`
          relative overflow-hidden p-6
          ${plan.tier === 'pro' ? 'ring-2 ring-purple-500/50' : ''}
          ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''}
        `}
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
        <div className="relative text-center mb-6">
          <motion.div
            animate={{ 
              rotate: isHovered ? [0, -10, 10, 0] : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            className={`
              inline-flex p-4 rounded-2xl mb-4
              bg-gradient-to-br ${tierGradient} text-white
            `}
          >
            {TIER_ICONS[plan.tier]}
          </motion.div>
          
          <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
          <p className="text-sm text-white/60">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
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
                  <div className="text-sm text-white/60">
                    ${yearlyTotal} billed yearly
                  </div>
                  {monthlySavings && parseFloat(monthlySavings) > 0 && (
                    <div className="text-sm text-green-400 font-medium">
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
          <ul className="space-y-3 mb-6">
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
              <li className="text-sm text-white/60 pl-7">
                +{plan.features.length - maxFeatures} more features
              </li>
            )}
          </ul>
        )}

        {/* Limits summary */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white/60">Groups</div>
            <div className="font-semibold text-white">
              {plan.limits.maxGroups === -1 ? 'Unlimited' : plan.limits.maxGroups}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white/60">Storage</div>
            <div className="font-semibold text-white">
              {plan.limits.maxStorageGB}GB
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white/60">File Size</div>
            <div className="font-semibold text-white">
              {plan.limits.maxFileSize}MB
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
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
          className={`
            w-full py-3 font-semibold rounded-xl
            ${isCurrentPlan 
              ? 'bg-white/10 text-white/60 cursor-default' 
              : `bg-gradient-to-r ${tierGradient} text-white hover:opacity-90`
            }
          `}
        >
          {isCurrentPlan ? 'Current Plan' : plan.priceMonthly === 0 ? 'Get Started' : 'Subscribe Now'}
        </Button>

        {/* Compare link */}
        {onCompare && (
          <button
            onClick={onCompare}
            className="w-full mt-3 text-sm text-white/60 hover:text-white transition-colors"
          >
            Compare all features →
          </button>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default SubscriptionCard;
