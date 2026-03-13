/**
 * Creator Service
 *
 * Backend API integration for creator monetization features:
 * - Stripe Connect onboarding
 * - Creator status
 * - Balance and payouts
 * - Analytics (overview, earnings, subscribers, content)
 * - Forum subscriptions and monetization settings
 *
 * @module services/creatorService
 * @since v1.0.0
 */

import api from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export interface CreatorStatus {
  isCreator: boolean;
  onboardingComplete: boolean;
  creatorStatus: 'none' | 'pending' | 'active' | 'suspended';
  stripeAccountId?: string;
  onboardedAt?: string | null;
}

export interface CreatorBalance {
  available: number;
  pending: number;
  currency: string;
  totalEarnedCents: number;
  totalPaidOutCents: number;
  availableBalanceCents: number;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  amountCents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currency: string;
  requestedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  subscriberCount: number;
  mrrCents: number;
  churnRate: number;
  platformFeePercent: number;
}

// ── API Functions ──────────────────────────────────────────────────────

/** Start Stripe Connect onboarding */
export async function onboard() {
  const response = await api.post('/api/v1/creator/onboard');
  return response.data?.data;
}

/** Get current creator status */
export async function getCreatorStatus(): Promise<CreatorStatus> {
  const response = await api.get('/api/v1/creator/status');
  return response.data?.data;
}

/** Generate a new onboarding link */
export async function refreshOnboard() {
  const response = await api.post('/api/v1/creator/onboard/refresh');
  return response.data?.data;
}

/** Get earnings balance */
export async function getBalance(): Promise<CreatorBalance> {
  const response = await api.get('/api/v1/creator/balance');
  return response.data?.data;
}

/** Request a payout ($10 minimum) */
export async function requestPayout(amount?: number): Promise<PayoutRequest> {
  const response = await api.post('/api/v1/creator/payout', { amount });
  return response.data?.data;
}

/** List past payouts (paginated) */
export async function listPayouts(page = 1): Promise<PayoutRequest[]> {
  const response = await api.get('/api/v1/creator/payouts', { params: { page } });
  return response.data?.data;
}

/** Get overview analytics */
export async function getAnalyticsOverview(params?: {
  period?: string;
}): Promise<AnalyticsOverview> {
  const response = await api.get('/api/v1/creator/analytics/overview', { params });
  return response.data?.data;
}

/** Get earnings analytics */
export async function getAnalyticsEarnings(params?: { period?: string }) {
  const response = await api.get('/api/v1/creator/analytics/earnings', { params });
  return response.data?.data;
}

/** Get subscriber analytics */
export async function getAnalyticsSubscribers() {
  const response = await api.get('/api/v1/creator/analytics/subscribers');
  return response.data?.data;
}

/** Get content analytics */
export async function getAnalyticsContent() {
  const response = await api.get('/api/v1/creator/analytics/content');
  return response.data?.data;
}

/** Subscribe to a paid forum */
export async function subscribeForum(forumId: string) {
  const response = await api.post(`/api/v1/forums/${forumId}/subscribe`);
  return response.data?.data;
}

/** Unsubscribe from a paid forum */
export async function unsubscribeForum(forumId: string) {
  const response = await api.delete(`/api/v1/forums/${forumId}/subscribe`);
  return response.data?.data;
}

/** Update forum monetization settings */
export async function updateMonetization(forumId: string, settings: Record<string, unknown>) {
  const response = await api.put(`/api/v1/forums/${forumId}/monetization`, settings);
  return response.data?.data;
}

// ── Premium Threads & Tiers (Phase 36) ────────────────────────────────

/** List premium threads for the current creator */
export async function listPremiumThreads() {
  const response = await api.get('/api/v1/creator/premium-threads');
  return response.data?.data;
}

/** Create a premium thread */
export async function createPremiumThread(attrs: {
  threadId: string;
  priceNodes: number;
  subscriberOnly?: boolean;
  previewLength?: number;
}) {
  const response = await api.post('/api/v1/creator/premium-threads', attrs);
  return response.data?.data;
}

/** List subscription tiers for the current creator */
export async function listTiers() {
  const response = await api.get('/api/v1/creator/tiers');
  return response.data?.data;
}

/** Create a subscription tier */
export async function createTier(attrs: {
  forumId: string;
  name: string;
  priceMonthlyNodes: number;
}) {
  const response = await api.post('/api/v1/creator/tiers', attrs);
  return response.data?.data;
}
