/**
 * useCreatorDashboard Hook
 *
 * Wraps creator store for dashboard-specific data: balance,
 * analytics, payouts, and payout request actions.
 *
 * @module modules/creator/hooks/useCreatorDashboard
 */

import { useCallback } from 'react';
import { useCreatorStore } from '../store';

export function useCreatorDashboard() {
  const balance = useCreatorStore((s) => s.balance);
  const payouts = useCreatorStore((s) => s.payouts);
  const analyticsOverview = useCreatorStore((s) => s.analyticsOverview);
  const earningsData = useCreatorStore((s) => s.earningsData);
  const subscriberAnalytics = useCreatorStore((s) => s.subscriberAnalytics);
  const contentAnalytics = useCreatorStore((s) => s.contentAnalytics);
  const isLoadingBalance = useCreatorStore((s) => s.isLoadingBalance);
  const isLoadingPayouts = useCreatorStore((s) => s.isLoadingPayouts);
  const isLoadingAnalytics = useCreatorStore((s) => s.isLoadingAnalytics);
  const isLoading = useCreatorStore((s) => s.isLoading);
  const error = useCreatorStore((s) => s.error);

  const fetchBalance = useCreatorStore((s) => s.fetchBalance);
  const fetchPayouts = useCreatorStore((s) => s.fetchPayouts);
  const fetchAnalyticsOverview = useCreatorStore((s) => s.fetchAnalyticsOverview);
  const fetchAnalyticsEarnings = useCreatorStore((s) => s.fetchAnalyticsEarnings);
  const fetchAnalyticsSubscribers = useCreatorStore((s) => s.fetchAnalyticsSubscribers);
  const fetchAnalyticsContent = useCreatorStore((s) => s.fetchAnalyticsContent);
  const requestPayoutAction = useCreatorStore((s) => s.requestPayout);

  const requestPayout = useCallback(
    async (amount?: number) => {
      return requestPayoutAction(amount);
    },
    [requestPayoutAction],
  );

  const fetchAllAnalytics = useCallback(
    async (params?: { period?: string }) => {
      await Promise.all([
        fetchAnalyticsOverview(params),
        fetchAnalyticsEarnings(params),
      ]);
    },
    [fetchAnalyticsOverview, fetchAnalyticsEarnings],
  );

  return {
    // Data
    balance,
    payouts,
    analyticsOverview,
    earningsData,
    subscriberAnalytics,
    contentAnalytics,

    // Loading states
    isLoading,
    isLoadingBalance,
    isLoadingPayouts,
    isLoadingAnalytics,
    error,

    // Actions
    fetchBalance,
    fetchPayouts,
    fetchAnalyticsOverview,
    fetchAnalyticsEarnings,
    fetchAnalyticsSubscribers,
    fetchAnalyticsContent,
    fetchAllAnalytics,
    requestPayout,
  };
}
