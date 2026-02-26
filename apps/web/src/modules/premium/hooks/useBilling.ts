/**
 * Billing hook — wraps billingService for use in page components.
 *
 * Pages cannot import services directly (ESLint no-restricted-imports).
 * This hook provides a stable interface for checkout, portal, and plan queries.
 *
 * @module modules/premium/hooks/useBilling
 */

import { useCallback } from 'react';
import { billingService } from '@/services/billing';
import type { PlanId } from '@/lib/stripe';

/**
 * unknown for the premium module.
 */
/**
 * Hook for managing billing.
 */
export function useBilling() {
  const redirectToCheckout = useCallback(async (planId: PlanId, yearly = false) => {
    await billingService.redirectToCheckout(planId, yearly);
  }, []);

  const redirectToPortal = useCallback(async () => {
    await billingService.redirectToPortal();
  }, []);

  const getPlans = useCallback(async () => {
    return billingService.getPlans();
  }, []);

  return { redirectToCheckout, redirectToPortal, getPlans };
}
