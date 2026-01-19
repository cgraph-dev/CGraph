import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { StarIcon, StarIcon as CrownIcon } from '@heroicons/react/24/solid'; // CrownIcon doesn't exist, using StarIcon
import { useThemeStore } from '@/stores/themeStore';

// Reserved for future use
void CrownIcon;
import { useAuthStore } from '@/stores/authStore';
import GlassCard from '@/components/ui/GlassCard';

/**
 * PremiumThemeGate Component
 *
 * Guards premium theme features and displays upgrade prompts.
 * Features:
 * - Animated lock overlay for locked features
 * - Tier badges (Free, Premium, Elite)
 * - Upgrade modal with feature comparison
 * - Graceful degradation for non-premium users
 * - Preview mode for locked themes
 */

interface PremiumThemeGateProps {
  children: ReactNode;
  requiredTier: 'free' | 'premium' | 'elite';
  featureName?: string;
  showPreview?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
}

const tierHierarchy = {
  free: 0,
  premium: 1,
  elite: 2,
};

const tierConfig = {
  free: {
    label: 'Free',
    color: 'text-gray-400',
    bgColor: 'bg-gray-700',
    borderColor: 'border-gray-600',
    icon: null,
  },
  premium: {
    label: 'Premium',
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-r from-amber-600 to-amber-500',
    borderColor: 'border-amber-500',
    icon: StarIcon,
  },
  elite: {
    label: 'Elite',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-600 to-pink-500',
    borderColor: 'border-purple-500',
    icon: SparklesIcon,
  },
};

export function PremiumThemeGate({
  children,
  requiredTier,
  featureName = 'This feature',
  showPreview = true,
  className = '',
  onUpgradeClick,
}: PremiumThemeGateProps) {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Determine user's current tier (from subscription or user data)
  const userTier = user?.subscription?.tier || (theme.isPremium ? 'premium' : 'free');
  const hasAccess =
    tierHierarchy[userTier as keyof typeof tierHierarchy] >= tierHierarchy[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  const config = tierConfig[requiredTier];
  const TierIcon = config.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Preview mode - show blurred content */}
      {showPreview && (
        <div className="relative overflow-hidden rounded-xl">
          <div className="pointer-events-none select-none blur-sm brightness-75">{children}</div>

          {/* Lock overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-dark-900/60 backdrop-blur-sm"
          >
            <GlassCard variant="frosted" glow className="max-w-sm p-6 text-center">
              {/* Lock icon with animation */}
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-800"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                    '0 0 40px rgba(139, 92, 246, 0.5)',
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <LockClosedIcon className="h-8 w-8 text-purple-400" />
              </motion.div>

              {/* Tier badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${config.bgColor} mb-3`}
              >
                {TierIcon && <TierIcon className="h-4 w-4 text-white" />}
                <span className="text-sm font-semibold text-white">{config.label} Required</span>
              </div>

              <h3 className="mb-2 text-lg font-bold text-white">Unlock {featureName}</h3>
              <p className="mb-4 text-sm text-gray-400">
                Upgrade to {config.label} to access this exclusive feature and many more.
              </p>

              {/* Upgrade button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (onUpgradeClick) {
                    onUpgradeClick();
                  } else {
                    setShowUpgradeModal(true);
                  }
                }}
                className={`w-full rounded-xl px-6 py-3 font-semibold text-white ${config.bgColor} shadow-lg transition-shadow hover:shadow-xl`}
              >
                <span className="flex items-center justify-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Upgrade to {config.label}
                </span>
              </motion.button>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Non-preview mode - show simple locked message */}
      {!showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-dashed border-gray-700 bg-dark-800/50 p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${config.bgColor}`}>
              <LockClosedIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{featureName}</p>
              <p className="text-xs text-gray-400">{config.label} tier required</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpgradeClick?.() || setShowUpgradeModal(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${config.bgColor}`}
            >
              Upgrade
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal requiredTier={requiredTier} onClose={() => setShowUpgradeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface UpgradeModalProps {
  requiredTier: 'free' | 'premium' | 'elite';
  onClose: () => void;
}

function UpgradeModal({ requiredTier, onClose }: UpgradeModalProps) {
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
      tier: 'elite' as const,
      name: 'Elite',
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
      highlighted: requiredTier === 'elite',
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
              transition={{ duration: 2, repeat: Infinity }}
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
                      ? `${config.borderColor} bg-dark-800/80`
                      : 'border-gray-700 bg-dark-800/40'
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
                      plan.highlighted ? config.bgColor : 'bg-dark-700 hover:bg-dark-600'
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

// Tier Badge component for display
export function TierBadge({ tier }: { tier: 'free' | 'premium' | 'elite' }) {
  const config = tierConfig[tier];
  const TierIcon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${config.bgColor}`}>
      {TierIcon && <TierIcon className="h-3 w-3 text-white" />}
      <span className="text-xs font-medium text-white">{config.label}</span>
    </div>
  );
}

export default PremiumThemeGate;
