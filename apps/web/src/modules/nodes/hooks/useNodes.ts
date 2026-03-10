/**
 * Nodes TanStack Query hooks.
 *
 * Server-state management for wallet, transactions, bundles,
 * and mutations for tipping, unlocking, checkout, and withdrawal.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nodesApi } from '../services/nodesApi';
import type { TransactionType } from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────

export const nodesKeys = {
  all: ['nodes'] as const,
  wallet: () => [...nodesKeys.all, 'wallet'] as const,
  transactions: (type?: string) => [...nodesKeys.all, 'transactions', type] as const,
  bundles: () => [...nodesKeys.all, 'bundles'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────

/** Fetch the user's node wallet. */
export function useNodeWallet() {
  return useQuery({
    queryKey: nodesKeys.wallet(),
    queryFn: () => nodesApi.getWallet(),
    staleTime: 30_000,
  });
}

/** Fetch transaction history, optionally filtered by type. */
export function useNodeTransactions(type?: TransactionType) {
  return useQuery({
    queryKey: nodesKeys.transactions(type),
    queryFn: () => nodesApi.getTransactions({ type }),
    staleTime: 30_000,
  });
}

/** Fetch available node bundles. */
export function useNodeBundles() {
  return useQuery({
    queryKey: nodesKeys.bundles(),
    queryFn: () => nodesApi.getBundles(),
    staleTime: 5 * 60_000,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────

/** Send a tip to another user. */
export function useSendTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, amount }: { recipientId: string; amount: number }) =>
      nodesApi.sendTip(recipientId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
    },
  });
}

/** Unlock gated content (thread). */
export function useUnlockContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => nodesApi.unlockContent(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
      // Thread data also needs refetch — handled by caller via queryKey invalidation
    },
  });
}

/** Create a Stripe Checkout session for a bundle. */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: (bundleId: string) => nodesApi.createCheckout(bundleId),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
  });
}

/** Request a withdrawal. */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodesAmount: number) => nodesApi.requestWithdrawal(nodesAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodesKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: nodesKeys.transactions() });
    },
  });
}
