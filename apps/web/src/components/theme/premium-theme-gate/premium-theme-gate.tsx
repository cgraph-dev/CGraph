/**
 * Premium theme access gate component.
 * @module
 */
import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';

// eslint-disable-next-line no-restricted-imports
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/modules/auth/store';
import { GlassCard } from '@/shared/components/ui';
import { tierHierarchy, tierConfig, type PremiumTier } from './tier-config';
import { UpgradeModal } from './upgrade-modal';
import { tweens, loop } from '@/lib/animation-presets';

interface PremiumThemeGateProps {
  children: ReactNode;
  requiredTier: PremiumTier;
  featureName?: string;
  showPreview?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
}

/**
 * unknown for the theme module.
 */
/**
 * Premium Theme Gate component.
 */
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
            className="absolute inset-0 flex items-center justify-center bg-[rgb(30,32,40)]/60 backdrop-blur-sm"
          >
            <GlassCard variant="frosted" glow className="max-w-sm p-6 text-center">
              {/* Lock icon with animation */}
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                    '0 0 40px rgba(139, 92, 246, 0.5)',
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                  ],
                }}
                transition={loop(tweens.ambient)}
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
          className="rounded-xl border-2 border-dashed border-gray-700 bg-white/[0.04] p-4"
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

export default PremiumThemeGate;
