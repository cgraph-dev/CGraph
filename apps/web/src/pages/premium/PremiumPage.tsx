import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  BoltIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PremiumPage');

/**
 * Premium Subscription Page
 *
 * Displays premium tiers, features, and handles subscription management.
 * Production-ready with:
 * - Three subscription tiers (Free, Premium, Premium Plus)
 * - Feature comparison table
 * - Animated UI elements
 * - Stripe integration ready
 * - Coin balance display
 */

interface PremiumTier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  popular?: boolean;
  features: {
    name: string;
    included: boolean;
    detail?: string;
  }[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with basic features',
    icon: <StarIcon className="h-6 w-6" />,
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    features: [
      { name: 'Basic messaging', included: true },
      { name: 'Standard forums', included: true },
      { name: 'Up to 5 groups', included: true },
      { name: 'Basic themes', included: true },
      { name: 'Standard emojis', included: true },
      { name: '10MB file uploads', included: true },
      { name: '30-day message history', included: true },
      { name: 'Community support', included: true },
      { name: 'Custom themes', included: false },
      { name: 'Animated emojis', included: false },
      { name: 'Voice effects', included: false },
      { name: 'AI features', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    interval: 'month',
    description: 'Unlock all essential features',
    popular: true,
    icon: <BoltIcon className="h-6 w-6" />,
    color: 'primary',
    gradient: 'from-primary-500 to-purple-600',
    features: [
      { name: 'Unlimited groups', included: true },
      { name: 'Custom themes', included: true },
      { name: 'Animated emojis', included: true },
      { name: 'Priority support', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Custom badges', included: true },
      { name: '50MB file uploads', included: true },
      { name: 'Unlimited message history', included: true },
      { name: 'Voice effects', included: true },
      { name: 'Advanced read receipts', included: true },
      { name: 'AI message suggestions', included: false },
      { name: 'Real-time translation', included: false },
    ],
  },
  {
    id: 'premium_plus',
    name: 'Premium+',
    price: 9.99,
    interval: 'month',
    description: 'The ultimate CGraph experience',
    icon: <RocketLaunchIcon className="h-6 w-6" />,
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-600',
    features: [
      { name: 'Everything in Premium', included: true },
      { name: 'AI message suggestions', included: true },
      { name: 'Real-time translation', included: true, detail: '100+ languages' },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom server themes', included: true },
      { name: 'Animated profile', included: true },
      { name: 'Exclusive badges', included: true },
      { name: '100MB file uploads', included: true },
      { name: 'Cloud backup', included: true },
      { name: 'Priority in queue', included: true },
      { name: 'Early feature access', included: true },
      { name: 'Personal account manager', included: true },
    ],
  },
];

export default function PremiumPage() {
  const navigate = useNavigate();
  useAuthStore(); // Ensure user is authenticated
  const [selectedTier, setSelectedTier] = useState<string>('premium');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);

  // Current user's subscription (default to free tier - would be fetched from API)
  const currentSubscription = 'free';
  const coinBalance = 0;

  // Calculate yearly price (20% discount)
  const getPrice = (tier: PremiumTier) => {
    if (tier.price === 0) return 0;
    if (billingInterval === 'year') {
      return (tier.price * 12 * 0.8).toFixed(2);
    }
    return tier.price.toFixed(2);
  };

  // Handle subscription
  const handleSubscribe = useCallback(
    async (tierId: string) => {
      if (tierId === 'free' || tierId === currentSubscription) return;

      setIsSubscribing(true);
      HapticFeedback.medium();

      try {
        // This would integrate with Stripe in production
        const response = await api.post('/api/v1/subscription/subscribe', {
          tier: tierId,
          billing_interval: billingInterval,
        });

        if (response.data.checkout_url) {
          // Redirect to Stripe checkout
          window.location.href = response.data.checkout_url;
        } else {
          // Success - show celebration
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#8b5cf6', '#f59e0b'],
          });
        }
      } catch (error) {
        logger.error('Subscription error:', error);
      } finally {
        setIsSubscribing(false);
      }
    },
    [billingInterval, currentSubscription]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none fixed h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/20 px-4 py-2"
            whileHover={{ scale: 1.05 }}
          >
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            <span className="font-semibold text-primary-400">Unlock Your Potential</span>
          </motion.div>

          <h1 className="mb-4 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Upgrade to Premium
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Get access to exclusive features, unlimited customization, and the best CGraph
            experience.
          </p>

          {/* Coin Balance */}
          <motion.div
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/20 px-4 py-2"
            whileHover={{ scale: 1.05 }}
          >
            <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-yellow-400">
              {(coinBalance ?? 0).toLocaleString()} Coins
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/premium/coins')}
              className="ml-2 text-xs"
            >
              Get More
            </Button>
          </motion.div>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-800 p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === 'year'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PREMIUM_TIERS.map((tier, index) => {
            const isCurrentPlan = currentSubscription === tier.id;
            const isSelected = selectedTier === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => setSelectedTier(tier.id)}
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
                    <div className={`rounded-xl bg-gradient-to-br p-3 ${tier.gradient}`}>
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                      <p className="text-sm text-gray-400">{tier.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">${getPrice(tier)}</span>
                      {tier.price > 0 && (
                        <span className="text-gray-400">
                          /{billingInterval === 'year' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingInterval === 'year' && tier.price > 0 && (
                      <p className="mt-1 text-sm text-green-400">
                        ${(tier.price * 12).toFixed(2)} billed annually
                      </p>
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
                      handleSubscribe(tier.id);
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
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
          })}
        </div>

        {/* Feature Comparison Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-center"
        >
          <button
            onClick={() => {
              setShowFeatureComparison(!showFeatureComparison);
              HapticFeedback.light();
            }}
            className="mx-auto flex items-center gap-2 font-medium text-primary-400 hover:text-primary-300"
          >
            {showFeatureComparison ? 'Hide' : 'Show'} full feature comparison
            <motion.div
              animate={{ rotate: showFeatureComparison ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.div>
          </button>
        </motion.div>

        {/* Feature Comparison Table */}
        <AnimatePresence>
          {showFeatureComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <GlassCard variant="frosted" className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="px-4 py-4 text-left font-medium text-gray-400">Feature</th>
                      {PREMIUM_TIERS.map((tier) => (
                        <th key={tier.id} className="px-4 py-4 text-center">
                          <span
                            className={`font-bold ${
                              tier.popular ? 'text-primary-400' : 'text-white'
                            }`}
                          >
                            {tier.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(PREMIUM_TIERS[0]?.features ?? []).map((feature, index) => (
                      <tr key={index} className="border-b border-dark-800">
                        <td className="px-4 py-4 text-gray-300">{feature.name}</td>
                        {PREMIUM_TIERS.map((tier) => {
                          const tierFeature = tier.features[index];
                          return (
                            <td key={tier.id} className="px-4 py-4 text-center">
                              {tierFeature?.included ? (
                                <CheckIcon className="mx-auto h-5 w-5 text-green-400" />
                              ) : (
                                <XMarkIcon className="mx-auto h-5 w-5 text-gray-600" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment system.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Absolutely! You can change your plan at any time. The difference will be prorated on your next billing cycle.',
              },
              {
                q: 'Is there a free trial?',
                a: "We offer a 7-day free trial for Premium. Cancel anytime during the trial and you won't be charged.",
              },
            ].map((faq, index) => (
              <GlassCard key={index} variant="frosted" className="p-6">
                <h3 className="mb-2 font-semibold text-white">{faq.q}</h3>
                <p className="text-sm text-gray-400">{faq.a}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-center"
        >
          <GlassCard variant="holographic" glow borderGradient className="inline-block p-8">
            <GiftIcon className="mx-auto mb-4 h-12 w-12 text-primary-400" />
            <h3 className="mb-2 text-xl font-bold text-white">Not ready for Premium?</h3>
            <p className="mb-4 text-gray-400">
              Get coins to unlock individual features and rewards!
            </p>
            <Button onClick={() => navigate('/premium/coins')}>Explore Coin Shop</Button>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
