/**
 * Billing and subscription settings panel.
 * @module
 */
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '@/modules/auth/store';
import { usePremiumStore } from '@/modules/premium/store';
import { api } from '@/lib/api';
import { safeRedirect } from '@/lib/security';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { billingService, type InvoiceRecord } from '@/services/billing';

/**
 * unknown for the settings module.
 */
/**
 * Billing Settings Panel component.
 */
export function BillingSettingsPanel() {
  const { user } = useAuthStore();
  const { currentTier, expiresAt, cancelAtPeriodEnd } = usePremiumStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    billingService
      .getInvoices()
      .then(setInvoices)
      .catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
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

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await api.post('/api/v1/premium/cancel');
      toast.success('Subscription will cancel at end of billing period');
      usePremiumStore.getState().fetchBillingStatus();
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const tierLabel = currentTier || (user?.isPremium ? 'premium' : 'free');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={tweens.standard}
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
              {tierLabel === 'premium' || tierLabel === 'enterprise' ? (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  ✨ {tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1)}
                </span>
              ) : (
                'Free'
              )}
            </p>
            <p className="text-gray-400">
              {tierLabel !== 'free' ? 'All features unlocked' : 'Basic features included'}
            </p>
            {expiresAt && (
              <p className="mt-1 text-xs text-gray-500">
                {cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                {new Date(expiresAt).toLocaleDateString()}
              </p>
            )}
            {cancelAtPeriodEnd && (
              <p className="mt-1 text-xs text-yellow-400">
                Subscription will end at the current billing period
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {tierLabel === 'free' && (
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
            {tierLabel !== 'free' && !cancelAtPeriodEnd && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </motion.button>
            )}
          </div>
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

      {/* Invoice History */}
      {invoices.length > 0 && (
        <GlassCard variant="crystal" className="mt-6 p-6">
          <h3 className="mb-4 font-medium text-white">Invoice History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-gray-400">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/[0.06]">
                    <td className="py-2 pr-4 text-gray-300">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-white">
                      ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : invoice.status === 'open'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Download PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}
