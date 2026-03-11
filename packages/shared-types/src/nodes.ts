/**
 * Nodes virtual currency — shared type definitions.
 *
 * Mirrors `CGraph.Nodes` from the Elixir backend.
 * The exchange rate constant is the single source of truth for
 * EUR ↔ Node conversions across web and mobile.
 *
 * @module shared-types/nodes
 */

// ─── Exchange Rate ───────────────────────────────────────────────────────────

/**
 * EUR value of a single Node.
 *
 * Backend equivalent: `@exchange_rate_eur 0.008` in `CGraph.Nodes`
 * (also expressed as `@eur_per_100_nodes Decimal.new("0.80")`).
 */
export const NODES_EXCHANGE_RATE_EUR = 0.008 as const;

/** EUR value per 100 Nodes — convenience constant matching backend. */
export const EUR_PER_100_NODES = 0.8 as const;

/** Platform cut percentage on earned transactions (tips, subscriptions). */
export const PLATFORM_CUT_PERCENT = 20 as const;

/** Hold period in days before earned nodes become withdrawable. */
export const HOLD_DAYS = 21 as const;

/** Minimum node balance required for withdrawal. */
export const MIN_WITHDRAWAL = 1000 as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a Node amount to EUR. */
export function nodesToEur(nodes: number): number {
  return nodes * NODES_EXCHANGE_RATE_EUR;
}

/** Convert EUR to a Node amount (rounded down). */
export function eurToNodes(eur: number): number {
  return Math.floor(eur / NODES_EXCHANGE_RATE_EUR);
}

// ─── Transaction Types ───────────────────────────────────────────────────────

/** All possible Node transaction types. */
export type NodeTransactionType =
  | 'purchase'
  | 'tip_received'
  | 'tip_sent'
  | 'content_unlock'
  | 'subscription_received'
  | 'subscription_sent'
  | 'withdrawal'
  | 'cosmetic_purchase';

/** A single Node transaction record. */
export interface NodeTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: NodeTransactionType;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inserted_at: string;
}

/** Node wallet state for a user. */
export interface NodeWallet {
  user_id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earned: number;
}

/** A purchasable Node bundle. */
export interface NodeBundle {
  id: string;
  name: string;
  node_amount: number;
  price_eur: number;
  /** Bonus percentage (e.g. 10 = 10% extra nodes). */
  bonus_percent: number;
  is_active: boolean;
}

/** Withdrawal request status. */
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

/** A node withdrawal request. */
export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  eur_amount: number;
  status: WithdrawalStatus;
  payout_method: string;
  requested_at: string;
  processed_at?: string;
}
