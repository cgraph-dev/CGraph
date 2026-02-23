/**
 * Billing and subscription settings panel.
 * @module
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';
import { safeRedirect } from '@/lib/security';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';

export function BillingSettingsPanel() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Redirect to Stripe checkout or show upgrade modal
      const response = await api.post('/api/v1/billing/checkout');
      if (response.data?.checkout_url) {
        safeRedirect(response.data.checkout_url);
      } else {
        toast.info('Premium upgrade coming soon!');
      }
    } catch {
      toast.info('Premium upgrade coming soon!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Billing
      </h1>

      <GlassCard
        variant={user?.isPremium ? 'holographic' : 'default'}
        glow={user?.isPremium}
        className="mb-6 p-6"
      >
        <h3 className="mb-2 font-medium text-white">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              {user?.isPremium ? (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  ✨ Premium
                </span>
              ) : (
                'Free'
              )}
            </p>
            <p className="text-gray-400">
              {user?.isPremium ? 'All features unlocked' : 'Basic features included'}
            </p>
          </div>
          {!user?.isPremium && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              disabled={isLoading}
              className="rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Upgrade to Premium'}
            </motion.button>
          )}
        </div>
      </GlassCard>

      <GlassCard variant="crystal" glow className="p-6">
        <h3 className="mb-4 font-medium text-white">Premium Benefits</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">Custom Profile Themes</span>
              <p className="text-sm text-gray-500">
                Personalize your profile with exclusive themes
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">Animated Avatars</span>
              <p className="text-sm text-gray-500">Upload GIF avatars and profile banners</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">Extended File Upload (100MB)</span>
              <p className="text-sm text-gray-500">Upload larger files and media</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">Custom Titles & Badges</span>
              <p className="text-sm text-gray-500">Unlock exclusive titles and badges</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">Priority Support</span>
              <p className="text-sm text-gray-500">Get faster response times from our team</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-lg text-green-400">✓</span>
            <div>
              <span className="font-medium">2x XP & Coin Earnings</span>
              <p className="text-sm text-gray-500">Level up faster and earn more rewards</p>
            </div>
          </li>
        </ul>
      </GlassCard>
    </motion.div>
  );
}
