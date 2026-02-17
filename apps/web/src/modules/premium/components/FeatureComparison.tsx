/**
 * FeatureComparison Component
 *
 * Side-by-side comparison of subscription tier features.
 * Features:
 * - Full feature matrix
 * - Highlight differences
 * - Responsive design
 * - Interactive tooltips
 * - Sticky headers
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { SubscriptionTier, SubscriptionPlan } from '@/modules/premium/store/types';
import {
  TIER_ICONS,
  TIER_COLORS,
  TIER_GRADIENTS,
  DEFAULT_CATEGORIES,
  type FeatureCategory,
  type FeatureItem,
} from './featureComparisonConstants';

// Re-export types for external consumers
export type { FeatureCategory, FeatureItem };

export interface FeatureComparisonProps {
  plans: SubscriptionPlan[];
  categories?: FeatureCategory[];
  currentTier?: SubscriptionTier;
  highlightedTier?: SubscriptionTier;
  onSelectPlan?: (tier: SubscriptionTier) => void;
  showPricing?: boolean;
  billingInterval?: 'monthly' | 'yearly';
  className?: string;
}

export const FeatureComparison: React.FC<FeatureComparisonProps> = ({
  plans,
  categories = DEFAULT_CATEGORIES,
  currentTier,
  highlightedTier = 'pro',
  onSelectPlan,
  showPricing = true,
  billingInterval = 'monthly',
  className = '',
}) => {
  const [hoveredTier, setHoveredTier] = useState<SubscriptionTier | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [tooltipFeature, setTooltipFeature] = useState<string | null>(null);

  const tiers: SubscriptionTier[] = ['free', 'plus', 'pro', 'business', 'enterprise'];

  const getPlanPrice = (tier: SubscriptionTier) => {
    const plan = plans.find((p) => p.tier === tier);
    if (!plan || plan.priceMonthly === 0) return 'Free';
    const price =
      billingInterval === 'yearly'
        ? (plan.priceYearly / 12).toFixed(2)
        : plan.priceMonthly.toFixed(2);
    return `$${price}/mo`;
  };

  const renderValue = (value: boolean | string | number, tier: SubscriptionTier) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon className={`h-5 w-5 text-${TIER_COLORS[tier]}-400`} />
      ) : (
        <XMarkIcon className="h-5 w-5 text-white/20" />
      );
    }
    return <span className="font-medium text-white">{value}</span>;
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    HapticFeedback.medium();
    onSelectPlan?.(tier);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[640px] border-collapse">
        {/* Header */}
        <thead>
          <tr>
            <th className="sticky left-0 w-64 bg-dark-900 p-4 text-left">
              <span className="text-lg font-bold text-white">Features</span>
            </th>
            {tiers.map((tier) => {
              const plan = plans.find((p) => p.tier === tier);
              const isHighlighted = tier === highlightedTier;
              const isCurrent = tier === currentTier;
              const isHovered = tier === hoveredTier;

              return (
                <th
                  key={tier}
                  onMouseEnter={() => setHoveredTier(tier)}
                  onMouseLeave={() => setHoveredTier(null)}
                  className={`relative min-w-[140px] p-4 text-center transition-all ${isHighlighted ? 'bg-purple-500/10' : ''} ${isHovered ? 'bg-white/5' : ''} `}
                >
                  {/* Recommended badge */}
                  {isHighlighted && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                        Recommended
                      </span>
                    </motion.div>
                  )}

                  {/* Tier icon and name */}
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{
                        scale: isHovered ? 1.1 : 1,
                      }}
                      className={`rounded-xl bg-gradient-to-br p-3 ${TIER_GRADIENTS[tier]} text-white`}
                    >
                      {TIER_ICONS[tier]}
                    </motion.div>
                    <span className="font-bold text-white">{plan?.name || tier}</span>

                    {/* Price */}
                    {showPricing && (
                      <span className="text-sm text-white/60">{getPlanPrice(tier)}</span>
                    )}

                    {/* Current plan indicator */}
                    {isCurrent && (
                      <span className="text-xs font-medium text-primary-400">Current Plan</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Categories and Features */}
        <tbody>
          {categories.map((category) => (
            <React.Fragment key={category.name}>
              {/* Category header */}
              <tr>
                <td
                  colSpan={tiers.length + 1}
                  className="sticky left-0 border-t border-white/5 bg-dark-800/50 p-3"
                >
                  <button
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.name ? null : category.name)
                    }
                    className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
                  >
                    <motion.span
                      animate={{
                        rotate:
                          expandedCategory === category.name || expandedCategory === null ? 0 : -90,
                      }}
                    >
                      ▼
                    </motion.span>
                    {category.name}
                  </button>
                </td>
              </tr>

              {/* Features */}
              <AnimatePresence>
                {(expandedCategory === null || expandedCategory === category.name) &&
                  category.features.map((feature) => (
                    <motion.tr
                      key={feature.name}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/5"
                    >
                      {/* Feature name */}
                      <td className="sticky left-0 bg-dark-900 p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white/80">{feature.name}</span>
                          {feature.description && (
                            <div className="relative">
                              <button
                                onMouseEnter={() => setTooltipFeature(feature.name)}
                                onMouseLeave={() => setTooltipFeature(null)}
                                className="rounded p-1 hover:bg-white/10"
                              >
                                <InformationCircleIcon className="h-4 w-4 text-white/40" />
                              </button>
                              <AnimatePresence>
                                {tooltipFeature === feature.name && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg bg-dark-700 p-2 text-xs text-white/70 shadow-lg"
                                  >
                                    {feature.description}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Feature values for each tier */}
                      {tiers.map((tier) => {
                        const isHighlighted = tier === highlightedTier;
                        const isHovered = tier === hoveredTier;

                        return (
                          <td
                            key={tier}
                            className={`p-4 text-center transition-all ${isHighlighted ? 'bg-purple-500/5' : ''} ${isHovered ? 'bg-white/5' : ''} `}
                          >
                            {renderValue(feature.values[tier], tier)}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </tbody>

        {/* Footer with CTAs */}
        <tfoot>
          <tr className="border-t border-white/10">
            <td className="sticky left-0 bg-dark-900 p-4" />
            {tiers.map((tier) => {
              const isCurrent = tier === currentTier;
              const isHighlighted = tier === highlightedTier;

              return (
                <td key={tier} className="p-4 text-center">
                  <Button
                    onClick={() => handleSelectPlan(tier)}
                    disabled={isCurrent}
                    className={`rounded-lg px-6 py-2 font-semibold transition-all ${
                      isCurrent
                        ? 'cursor-default bg-white/10 text-white/60'
                        : isHighlighted
                          ? `bg-gradient-to-r ${TIER_GRADIENTS[tier]} text-white hover:opacity-90`
                          : 'bg-white/10 text-white hover:bg-white/20'
                    } `}
                  >
                    {isCurrent ? 'Current' : tier === 'free' ? 'Get Started' : 'Upgrade'}
                  </Button>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>

      {/* Mobile-friendly view hint */}
      <div className="mt-4 text-center text-xs text-white/40 lg:hidden">
        ← Scroll horizontally to see all plans →
      </div>
    </div>
  );
};

export default FeatureComparison;
