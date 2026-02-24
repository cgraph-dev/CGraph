/**
 * Pricing Card Component
 *
 * Individual pricing tier card with features and CTA button.
 */

import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { PremiumTier, BillingInterval } from './types';
import { getPrice, getYearlyTotal } from './utils';
import { tweens, loop } from '@/lib/animation-presets';

interface PricingCardProps {
  tier: PremiumTier;
  index: number;
  isSelected: boolean;
  isCurrentPlan: boolean;
  isSubscribing: boolean;
  selectedTier: string;
  billingInterval: BillingInterval;
  onSelect: (tierId: string) => void;
  onSubscribe: (tierId: string) => void;
}

export function PricingCard({
  tier,
  index,
  isSelected,
  isCurrentPlan,
  isSubscribing,
  selectedTier,
  billingInterval,
  onSelect,
  onSubscribe,
}: PricingCardProps) {
  return (
    <motion.div
      key={tier.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      onClick={() => onSelect(tier.id)}
      className="cursor-pointer"
    >
      <GlassCard
        variant={tier.popular ? 'holographic' : 'frosted'}
        glow={tier.popular || isSelected}
        glowColor={tier.popular ? 'rgba(16, 185, 129, 0.3)' : undefined}
        borderGradient={tier.popular}
        className={`relative h-full overflow-hidden p-6 transition-all ${
          isSelected ? 'ring-2 ring-primary-500' : ''
        }`}
      >
        {/* Popular Badge */}
        {tier.popular && (
          <div className="absolute right-0 top-0">
            <div className="rounded-bl-lg bg-gradient-to-r from-primary-500 to-purple-500 px-4 py-1 text-xs font-bold text-white">
              MOST POPULAR
            </div>
          </div>
        )}

        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute left-4 top-4 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1"
          >
            <span className="text-xs font-semibold text-green-400">Current Plan</span>
          </motion.div>
        )}

        {/* Tier Header */}
        <div className="mb-4 mt-4 flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-br p-3 ${tier.gradient}`}>{tier.icon}</div>
          <div>
            <h3 className="text-xl font-bold text-white">{tier.name}</h3>
            <p className="text-sm text-gray-400">{tier.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">
              ${getPrice(tier, billingInterval)}
            </span>
            {tier.price > 0 && (
              <span className="text-gray-400">
                /{billingInterval === 'year' ? 'year' : 'month'}
              </span>
            )}
          </div>
          {billingInterval === 'year' && tier.price > 0 && (
            <p className="mt-1 text-sm text-green-400">${getYearlyTotal(tier)} billed annually</p>
          )}
        </div>

        {/* Features */}
        <ul className="mb-6 space-y-3">
          {tier.features.slice(0, 8).map((feature, fIndex) => (
            <motion.li
              key={fIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + fIndex * 0.05 }}
              className="flex items-center gap-2"
            >
              {feature.included ? (
                <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-400" />
              ) : (
                <XMarkIcon className="h-5 w-5 flex-shrink-0 text-gray-600" />
              )}
              <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                {feature.name}
                {feature.detail && (
                  <span className="ml-1 text-xs text-gray-500">({feature.detail})</span>
                )}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSubscribe(tier.id);
          }}
          disabled={isCurrentPlan || isSubscribing}
          className={`w-full rounded-xl py-3 font-semibold transition-all ${
            isCurrentPlan
              ? 'cursor-not-allowed bg-dark-700 text-gray-500'
              : tier.popular
                ? `bg-gradient-to-r ${tier.gradient} text-white hover:opacity-90`
                : 'bg-dark-700 text-white hover:bg-dark-600'
          }`}
          whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
          whileTap={!isCurrentPlan ? { scale: 0.98 } : {}}
        >
          {isSubscribing && selectedTier === tier.id ? (
            <motion.div
              className="mx-auto h-5 w-5 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={loop(tweens.slow)}
            />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : tier.id === 'free' ? (
            'Free Forever'
          ) : (
            `Get ${tier.name}`
          )}
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}
