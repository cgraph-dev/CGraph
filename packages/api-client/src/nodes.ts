/**
 * Typed API methods for the Nodes virtual currency system.
 *
 * Uses endpoint constants from `./endpoints` to ensure path consistency.
 * All methods return structured payloads aligned with shared-types definitions.
 *
 * @module @cgraph/api-client/nodes
 */

import type { ApiClient } from './client';
import type {
  NodeWallet,
  NodeTransaction,
  NodeBundle,
  WithdrawalRequest,
  TipContext,
} from '@cgraph/shared-types/nodes';
import { NODES } from './endpoints';

// ---------------------------------------------------------------------------
// API methods — each takes a pre-configured ApiClient instance
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's node wallet. */
export function getWallet(client: ApiClient): Promise<NodeWallet> {
  return client.get<NodeWallet>(NODES.wallet.path);
}

/** Fetch paginated transaction history. */
export function getTransactions(
  client: ApiClient,
  params?: { page?: number; per_page?: number }
): Promise<NodeTransaction[]> {
  return client.get<NodeTransaction[]>(NODES.transactions.path, {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}

/** Fetch available node bundles for purchase. */
export function getBundles(client: ApiClient): Promise<NodeBundle[]> {
  return client.get<NodeBundle[]>(NODES.bundles.path);
}

/** Send a tip to another user. */
export function tipUser(
  client: ApiClient,
  recipientId: string,
  amount: number,
  context: TipContext
): Promise<{ transaction_id: string; new_balance: number }> {
  return client.post(NODES.tip.path, {
    body: { recipient_id: recipientId, amount, context },
  });
}

/** Unlock gated content by paying the gate price. */
export function unlockContent(
  client: ApiClient,
  postId: string
): Promise<{ unlocked: boolean; new_balance: number }> {
  return client.post(NODES.unlock.path, {
    body: { post_id: postId },
  });
}

/** Request a withdrawal of earned nodes. */
export function withdraw(
  client: ApiClient,
  amount: number,
  payoutMethod: string
): Promise<WithdrawalRequest> {
  return client.post<WithdrawalRequest>(NODES.withdraw.path, {
    body: { amount, payout_method: payoutMethod },
  });
}
