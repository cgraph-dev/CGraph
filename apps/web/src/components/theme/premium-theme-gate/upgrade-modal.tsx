/**
 * Premium upgrade prompt modal.
 * @module
 */
import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { tierConfig, type PremiumTier } from './tier-config';
import { tweens, loop } from '@/lib/animation-presets';

interface UpgradeModalProps {
  requiredTier: PremiumTier;
  onClose: () => void;
}

/**
 * unknown for the theme module.
 */
/**
 * Upgrade Modal dialog component.
 */
export function UpgradeModal({ requiredTier, onClose }: UpgradeModalProps) {
  const plans = [
    {
      tier: 'premium' as const,
      name: 'Premium',
      price: '$4.99',
      period: '/month',
      features: [
        'Animated avatar borders',
        'Custom chat bubble colors',
        'Premium profile themes',
        '10+ effect presets',
        'Priority support',
      ],
      highlighted: requiredTier === 'premium',
    },
    {
      tier: 'enterprise' as const,
      name: 'Enterprise',
      price: '$9.99',
      period: '/month',
      features: [
        'All Premium features',
        'Legendary & Mythic borders',
        'Holographic effects',
        'Custom particle systems',
        'Exclusive seasonal themes',
        'Early access to features',
        'Custom CSS support',
      ],
      highlighted: requiredTier === 'enterprise',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="crystal" glow className="p-8">
          <div className="mb-8 text-center">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={loop(tweens.ambient)}
              className="mb-4 inline-block"
            >
              <SparklesIcon className="h-12 w-12 text-purple-400" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-white">Unlock Premium Features</h2>
            <p className="text-gray-400">
              Choose a plan that works for you and unlock exclusive customization options
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {plans.map((plan) => {
              const config = tierConfig[plan.tier];
              return (
                <motion.div
                  key={plan.tier}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-2xl border-2 p-6 ${
                    plan.highlighted
                      ? `${config.borderColor} bg-white/[0.06]`
                      : 'bg-white/[0.04]/40 border-gray-700'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold text-white ${config.bgColor}`}
                      >
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="mb-6 text-center">
                    <h3 className={`text-xl font-bold ${config.color}`}>{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <SparklesIcon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full rounded-xl py-3 font-semibold text-white ${
                      plan.highlighted ? config.bgColor : 'bg-white/[0.06] hover:bg-white/[0.10]'
                    }`}
                  >
                    Get {plan.name}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
              Maybe later
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
