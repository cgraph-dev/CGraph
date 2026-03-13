/**
 * Billing Settings Component
 *
 * Displays current subscription status and allows users to:
 * - View current plan
 * - Upgrade/downgrade subscription
 * - Manage billing through Stripe Portal
 *
 * @module components/settings/BillingSettings
 */

import { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, Check, Loader2, AlertCircle, FileText } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BillingSettings');
import { billingService, type BillingStatus, type InvoiceRecord } from '@/services/billing';
import { PLANS, type PlanId } from '@/lib/stripe';
import { usePremiumStore } from '@/modules/premium/store';

interface BillingSettingsProps {
  className?: string;
}

/**
 * unknown for the settings module.
 */
/**
 * Billing Settings component.
 */
export function BillingSettings({ className = '' }: BillingSettingsProps) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const fetchBillingStatus = usePremiumStore((s) => s.fetchBillingStatus);

  useEffect(() => {
    loadBillingStatus();
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBillingStatus() {
    try {
      setLoading(true);
      const data = await billingService.getStatus();
      setStatus(data);
      // Sync to Zustand store
      fetchBillingStatus();
    } catch (err) {
      setError('Failed to load billing information');
      logger.error('Billing status error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoices() {
    try {
      const data = await billingService.getInvoices();
      setInvoices(data);
    } catch {
      // Invoices are non-critical
    }
  }

  async function handleUpgrade(planId: PlanId) {
    if (planId === 'enterprise') {
      // Redirect to contact sales
      window.open('mailto:sales@cgraph.app?subject=Enterprise%20Inquiry', '_blank');
      return;
    }

    try {
      setCheckoutLoading(planId);
      await billingService.redirectToCheckout(planId, billingCycle === 'yearly');
    } catch (err) {
      setError('Failed to start checkout process');
      logger.error('Checkout error:', err);
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    try {
      setPortalLoading(true);
      await billingService.redirectToPortal();
    } catch (err) {
      setError('Failed to open billing portal');
      logger.error('Portal error:', err);
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // currentPlan is guaranteed to be defined since PLANS[0] always exists
  const currentPlan = PLANS.find((p) => p.id === status?.tier) ?? PLANS[0]!;
  const currentPlanIndex = PLANS.indexOf(currentPlan);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Current Plan */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              Current Plan
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {currentPlan.name} -{' '}
              {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
            </p>
            {status?.status === 'active' && status.currentPeriodEnd && (
              <p className="mt-2 text-xs text-gray-500">
                Renews on {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {status?.cancelAtPeriodEnd && (
              <p className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                <AlertCircle className="h-3 w-3" />
                Cancels at end of billing period
              </p>
            )}
          </div>
          {status?.stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.10] disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}>Monthly</span>
        <button
          onClick={() => setBillingCycle((c) => (c === 'monthly' ? 'yearly' : 'monthly'))}
          className="relative h-7 w-14 rounded-full bg-white/[0.06] transition-colors"
        >
          <div
            className={`absolute top-1 h-5 w-5 rounded-full bg-indigo-500 transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}>
          Yearly <span className="text-sm text-green-400">(Save 17%)</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === status?.tier;
          const isUpgrade = PLANS.indexOf(plan) > currentPlanIndex;
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.price;

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 transition-all ${
                plan.highlighted
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.08]'
              } ${isCurrent ? 'ring-2 ring-indigo-500' : ''}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                  Current
                </span>
              )}

              <h4 className="text-xl font-bold text-white">{plan.name}</h4>
              <p className="mt-1 text-sm text-gray-400">{plan.description}</p>

              <div className="mt-4">
                {price === -1 ? (
                  <span className="text-2xl font-bold text-white">Custom</span>
                ) : price === 0 ? (
                  <span className="text-2xl font-bold text-white">Free</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-white">${price}</span>
                    <span className="text-gray-400">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || checkoutLoading !== null}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                  isCurrent
                    ? 'cursor-not-allowed bg-white/[0.06] text-gray-400'
                    : plan.highlighted
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : 'bg-white/[0.06] text-white hover:bg-white/[0.10]'
                }`}
              >
                {checkoutLoading === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  'Current Plan'
                ) : plan.price === -1 ? (
                  'Contact Sales'
                ) : isUpgrade ? (
                  'Upgrade'
                ) : (
                  'Downgrade'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <FileText className="h-5 w-5 text-indigo-400" />
            Invoice History
          </h4>
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
                      {(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
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
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                        >
                          <FileText className="h-3 w-3" />
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
        <h4 className="mb-4 text-lg font-semibold text-white">Billing FAQ</h4>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-white">When will I be charged?</p>
            <p className="mt-1 text-gray-400">
              You'll be charged immediately when you upgrade. Your subscription will renew
              automatically at the end of each billing period.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">Can I cancel anytime?</p>
            <p className="mt-1 text-gray-400">
              Yes! You can cancel your subscription at any time. You'll keep your premium features
              until the end of your current billing period.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">What payment methods do you accept?</p>
            <p className="mt-1 text-gray-400">
              We accept all major credit cards (Visa, Mastercard, American Express) through our
              secure payment processor, Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingSettings;
