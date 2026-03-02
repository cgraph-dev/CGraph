/**
 * Checkout Return Page
 *
 * Handles redirects from Stripe Checkout (success/cancel).
 * Shows appropriate status and redirects user to billing settings.
 *
 * @module pages/premium/checkout-return
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { usePremiumStore } from '@/modules/premium/store';

/**
 * Checkout Return component — handles post-Stripe redirect.
 */
export function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fetchBillingStatus = usePremiumStore((s) => s.fetchBillingStatus);
  const [status, setStatus] = useState<'loading' | 'success' | 'cancelled'>('loading');

  useEffect(() => {
    const checkoutStatus = searchParams.get('status');

    if (checkoutStatus === 'success') {
      setStatus('success');
      // Sync subscription state from backend
      fetchBillingStatus();
      // Redirect to billing settings after 3s
      const timer = setTimeout(() => navigate('/settings/billing', { replace: true }), 3000);
      return () => clearTimeout(timer);
    } else if (checkoutStatus === 'cancelled') {
      setStatus('cancelled');
      const timer = setTimeout(() => navigate('/settings/billing', { replace: true }), 3000);
      return () => clearTimeout(timer);
    } else {
      // Unknown status — redirect immediately
      navigate('/settings/billing', { replace: true });
    }
  }, [searchParams, navigate, fetchBillingStatus]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md rounded-xl border border-gray-700 bg-gray-800/50 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
            <h2 className="text-xl font-semibold text-white">Processing...</h2>
            <p className="mt-2 text-gray-400">Please wait while we verify your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Subscription Activated!</h2>
            <p className="mt-2 text-gray-400">
              Welcome to Premium! Your tier has been upgraded. Redirecting to billing settings...
            </p>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Checkout Cancelled</h2>
            <p className="mt-2 text-gray-400">
              No worries! You can upgrade anytime from the billing settings. Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CheckoutReturn;
