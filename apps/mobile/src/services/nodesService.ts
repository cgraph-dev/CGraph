/**
 * Nodes Service — HTTP wrappers for all nodes/virtual-currency API endpoints.
 *
 * Follows the pattern established by forumService.
 * Uses the shared `api` client from `lib/api`.
 *
 * @module services/nodesService
 */

import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransactionParams {
  page?: number;
  per_page?: number;
  type?: string;
}

interface TipPayload {
  recipient_id: string;
  amount: number;
  context?: Record<string, unknown>;
}

interface WithdrawalPayload {
  amount: number;
  payout_method: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const nodesService = {
  // ─── Wallet ──────────────────────────────────────────────────────────
  getWallet: () =>
    api.get('/api/v1/nodes/wallet'),

  // ─── Transactions ────────────────────────────────────────────────────
  getTransactions: (params?: TransactionParams) =>
    api.get('/api/v1/nodes/transactions', { params }),

  // ─── Bundles ─────────────────────────────────────────────────────────
  getBundles: () =>
    api.get('/api/v1/nodes/bundles'),

  // ─── Tips ────────────────────────────────────────────────────────────
  sendTip: (recipientId: string, amount: number, context?: Record<string, unknown>) =>
    api.post('/api/v1/nodes/tips', {
      recipient_id: recipientId,
      amount,
      context,
    } satisfies TipPayload),

  // ─── Content Unlock ──────────────────────────────────────────────────
  unlockContent: (postId: string) =>
    api.post(`/api/v1/nodes/unlock/${postId}`),

  // ─── Withdrawals ─────────────────────────────────────────────────────
  requestWithdrawal: (amount: number, payoutMethod: string) =>
    api.post('/api/v1/nodes/withdrawals', {
      amount,
      payout_method: payoutMethod,
    } satisfies WithdrawalPayload),
};

export default nodesService;
