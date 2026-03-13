/**
 * Nodes API service.
 *
 * All endpoints under /api/v1/nodes.
 */
import { api } from '@/lib/api';
import type {
  NodeWallet,
  NodeTransaction,
  NodeBundle,
  WithdrawalRequest,
  CheckoutResponse,
} from '../types';

export const nodesApi = {
  /** Get the current user's wallet balance and stats. */
  async getWallet(): Promise<NodeWallet> {
    const res = await api.get<{ data: NodeWallet }>('/api/v1/nodes/wallet');
    return res.data.data;
  },

  /** Get transaction history with optional type filter. */
  async getTransactions(params?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<NodeTransaction[]> {
    const res = await api.get<{ data: NodeTransaction[] }>('/api/v1/nodes/transactions', {
      params,
    });
    return res.data.data;
  },

  /** Get available node bundles for purchase. */
  async getBundles(): Promise<NodeBundle[]> {
    const res = await api.get<{ data: NodeBundle[] }>('/api/v1/nodes/bundles');
    return res.data.data;
  },

  /** Create a Stripe Checkout session for a bundle purchase. */
  async createCheckout(bundleId: string): Promise<CheckoutResponse> {
    const res = await api.post<CheckoutResponse>('/api/v1/nodes/checkout', {
      bundle_id: bundleId,
    });
    return res.data;
  },

  /** Send a tip to another user. */
  async sendTip(recipientId: string, amount: number): Promise<NodeTransaction> {
    const res = await api.post<{ data: NodeTransaction }>('/api/v1/nodes/tip', {
      recipient_id: recipientId,
      amount,
    });
    return res.data.data;
  },

  /** Unlock gated content (thread). */
  async unlockContent(threadId: string): Promise<NodeTransaction> {
    const res = await api.post<{ data: NodeTransaction }>('/api/v1/nodes/unlock', {
      thread_id: threadId,
    });
    return res.data.data;
  },

  /** Request a withdrawal. */
  async requestWithdrawal(nodesAmount: number): Promise<WithdrawalRequest> {
    const res = await api.post<{ data: WithdrawalRequest }>('/api/v1/nodes/withdraw', {
      nodes_amount: nodesAmount,
    });
    return res.data.data;
  },
};
