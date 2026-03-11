/**
 * Nodes Store — Zustand store for virtual-currency state.
 *
 * Uses `create()` with MANUAL AsyncStorage persistence (no persist middleware).
 * Follows the same pattern as themeStore.
 *
 * @module stores/nodesStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nodesService } from '../services/nodesService';
import type {
  NodeWallet,
  NodeTransaction,
  NodeBundle,
} from '@cgraph/shared-types/src/nodes';
import { NODES_EXCHANGE_RATE_EUR } from '@cgraph/shared-types/src/nodes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@cgraph_nodes_state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NodesState {
  readonly balance: number;
  readonly eurBalance: number;
  readonly pendingBalance: number;
  readonly lifetimeEarned: number;
  readonly transactions: NodeTransaction[];
  readonly bundles: NodeBundle[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface NodesActions {
  readonly fetchWallet: () => Promise<void>;
  readonly fetchTransactions: (params?: {
    page?: number;
    per_page?: number;
    type?: string;
  }) => Promise<void>;
  readonly fetchBundles: () => Promise<void>;
  readonly tip: (recipientId: string, amount: number, context?: Record<string, unknown>) => Promise<void>;
  readonly unlock: (postId: string) => Promise<void>;
  readonly withdraw: (amount: number, payoutMethod: string) => Promise<void>;
  readonly hydrate: () => Promise<void>;
  readonly reset: () => void;
}

type NodesStore = NodesState & NodesActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialState: NodesState = {
  balance: 0,
  eurBalance: 0,
  pendingBalance: 0,
  lifetimeEarned: 0,
  transactions: [],
  bundles: [],
  isLoading: false,
  error: null,
};

async function persistState(state: Partial<NodesState>): Promise<void> {
  try {
    const { balance, eurBalance, pendingBalance, lifetimeEarned } = {
      ...initialState,
      ...state,
    };
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ balance, eurBalance, pendingBalance, lifetimeEarned }),
    );
  } catch {
    // Silently fail — local cache is non-critical
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNodesStore = create<NodesStore>((set, get) => ({
  ...initialState,

  // ─── Hydrate from AsyncStorage ─────────────────────────────────────
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Partial<NodesState>;
        set({
          balance: cached.balance ?? 0,
          eurBalance: cached.eurBalance ?? 0,
          pendingBalance: cached.pendingBalance ?? 0,
          lifetimeEarned: cached.lifetimeEarned ?? 0,
        });
      }
    } catch {
      // Keep defaults on failure
    }
  },

  // ─── Wallet ────────────────────────────────────────────────────────
  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await nodesService.getWallet();
      const wallet = data as NodeWallet;
      const newState = {
        balance: wallet.available_balance,
        eurBalance: wallet.available_balance * NODES_EXCHANGE_RATE_EUR,
        pendingBalance: wallet.pending_balance,
        lifetimeEarned: wallet.lifetime_earned,
        isLoading: false,
      };
      set(newState);
      await persistState(newState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet';
      set({ isLoading: false, error: message });
    }
  },

  // ─── Transactions ──────────────────────────────────────────────────
  fetchTransactions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await nodesService.getTransactions(params);
      const items = (data as { transactions: NodeTransaction[] }).transactions ?? [];
      set({ transactions: items, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      set({ isLoading: false, error: message });
    }
  },

  // ─── Bundles ───────────────────────────────────────────────────────
  fetchBundles: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await nodesService.getBundles();
      const items = (data as { bundles: NodeBundle[] }).bundles ?? [];
      set({ bundles: items, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bundles';
      set({ isLoading: false, error: message });
    }
  },

  // ─── Tip (optimistic) ─────────────────────────────────────────────
  tip: async (recipientId, amount, context) => {
    const prev = get();
    const optimisticBalance = prev.balance - amount;
    const optimisticEur = optimisticBalance * NODES_EXCHANGE_RATE_EUR;

    // Optimistic update
    set({
      balance: optimisticBalance,
      eurBalance: optimisticEur,
      error: null,
    });

    try {
      await nodesService.sendTip(recipientId, amount, context);
      await persistState({ balance: optimisticBalance, eurBalance: optimisticEur });
    } catch (err: unknown) {
      // Rollback on failure
      set({
        balance: prev.balance,
        eurBalance: prev.eurBalance,
        error: err instanceof Error ? err.message : 'Tip failed',
      });
    }
  },

  // ─── Unlock ────────────────────────────────────────────────────────
  unlock: async (postId) => {
    set({ isLoading: true, error: null });
    try {
      await nodesService.unlockContent(postId);
      // Refresh wallet to get updated balance
      await get().fetchWallet();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unlock failed';
      set({ isLoading: false, error: message });
    }
  },

  // ─── Withdraw ──────────────────────────────────────────────────────
  withdraw: async (amount, payoutMethod) => {
    set({ isLoading: true, error: null });
    try {
      await nodesService.requestWithdrawal(amount, payoutMethod);
      // Refresh wallet to get updated balance
      await get().fetchWallet();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed';
      set({ isLoading: false, error: message });
    }
  },

  // ─── Reset ─────────────────────────────────────────────────────────
  reset: () => {
    set(initialState);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select only the balance. */
export const useNodesBalance = () => useNodesStore((s) => s.balance);

/** Select balance in EUR. */
export const useNodesEurBalance = () => useNodesStore((s) => s.eurBalance);

/** Select transactions list. */
export const useNodesTransactions = () => useNodesStore((s) => s.transactions);

/** Select bundles list. */
export const useNodesBundles = () => useNodesStore((s) => s.bundles);

/** Select loading state. */
export const useNodesLoading = () => useNodesStore((s) => s.isLoading);

/** Select error state. */
export const useNodesError = () => useNodesStore((s) => s.error);
