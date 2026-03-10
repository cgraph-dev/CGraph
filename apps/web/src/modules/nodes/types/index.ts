/**
 * Nodes types — virtual currency system.
 */

/** Wallet balance and lifetime stats. */
export interface NodeWallet {
  user_id: string;
  available_balance: number;
  pending_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

/** Transaction types in the Nodes system. */
export type TransactionType =
  | 'purchase'
  | 'tip_received'
  | 'tip_sent'
  | 'content_unlock'
  | 'subscription_received'
  | 'subscription_sent'
  | 'withdrawal'
  | 'cosmetic_purchase';

/** A single node transaction record. */
export interface NodeTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  reference_id: string | null;
  reference_type: string | null;
  platform_cut: number | null;
  net_amount: number | null;
  metadata: Record<string, unknown> | null;
  inserted_at: string;
}

/** A purchasable node bundle. */
export interface NodeBundle {
  id: string;
  name: string;
  nodes: number;
  price: number;
  bonus_percent: number;
  popular: boolean;
}

/** A withdrawal request. */
export interface WithdrawalRequest {
  id: string;
  nodes_amount: number;
  fiat_amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inserted_at: string;
  completed_at: string | null;
}

/** Checkout response from Stripe. */
export interface CheckoutResponse {
  success: boolean;
  checkout_url: string;
}
