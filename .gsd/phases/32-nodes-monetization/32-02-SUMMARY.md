---
phase: 32-nodes-monetization
plan: "02"
subsystem: ui
tags: [nodes, react, zustand, tanstack-query, stripe, tipping, content-unlock, tailwind]

requires:
  - phase: 32-nodes-monetization/01
    provides: Backend API at /api/v1/nodes/* (wallet, transactions, bundles, checkout, tip, unlock, withdraw)

provides:
  - Nodes wallet page at /nodes with balance, transactions, withdrawal
  - Nodes shop page at /nodes/shop with 5 bundle cards + Stripe Checkout
  - TipButton + TipModal for tipping users on forum posts
  - Content unlock wired in thread-view.tsx (replaces Phase 32 placeholder)
  - Nodes module (store, hooks, services, types) at modules/nodes/

affects: [mobile, design-system]

tech-stack:
  added: []
  patterns:
    - "nodesApi service object with async methods (matches creatorService pattern)"
    - "TanStack Query with nodesKeys factory for cache invalidation"
    - "Zustand persist store with safeLocalStorage for wallet state"
    - "TipModal with preset amounts (10/50/100/500) + custom input"

key-files:
  created:
    - apps/web/src/modules/nodes/index.ts
    - apps/web/src/modules/nodes/types/index.ts
    - apps/web/src/modules/nodes/services/nodesApi.ts
    - apps/web/src/modules/nodes/store/nodesStore.ts
    - apps/web/src/modules/nodes/hooks/useNodes.ts
    - apps/web/src/modules/nodes/components/tip-button.tsx
    - apps/web/src/modules/nodes/components/tip-modal.tsx
    - apps/web/src/modules/nodes/components/bundle-card.tsx
    - apps/web/src/modules/nodes/components/transaction-row.tsx
    - apps/web/src/modules/nodes/components/withdrawal-modal.tsx
    - apps/web/src/pages/nodes/nodes-wallet.tsx
    - apps/web/src/pages/nodes/nodes-shop.tsx
  modified:
    - apps/web/src/routes/lazyPages.ts
    - apps/web/src/routes/app-routes.tsx
    - apps/web/src/modules/premium/components/index.ts
    - apps/web/src/pages/premium/index.ts
    - apps/web/src/modules/forums/components/thread-view/thread-view.tsx

key-decisions:
  - "Used /nodes route (not /wallet) to avoid naming conflict with WalletAuth"
  - "TipButton is a self-contained component with embedded TipModal"
  - "Content unlock navigates to /nodes/shop on insufficient balance"
  - "Used Unicode ℕ character for Nodes symbol throughout UI"
  - "Kept premium-page/, premiumStore, WalletAuth, lib/stripe.tsx untouched"

patterns-established:
  - "Nodes module: types → services → hooks → components → pages layering"
  - "nodesKeys factory for hierarchical query key management"

duration: ~30min
completed: 2026-03-10
---

# Phase 32 Plan 02: Nodes Frontend Summary

**Replaced coin shop with complete Nodes UI — wallet page, shop with Stripe Checkout, tipping modal, and content unlock wired to backend.**

## Performance

- **Tasks:** 5/5 completed
- **Files created:** 12
- **Files modified:** 5
- **Files deleted:** 18

## Accomplishments

- Deleted 18 coin shop frontend files and cleaned up all references
- Built complete Nodes module (types, API service, Zustand store, TanStack Query hooks)
- Created wallet page with balance card, transaction history with type filters, and withdrawal modal
- Created shop page with 5 bundle cards and Stripe Checkout flow
- Built TipButton + TipModal with presets (10/50/100/500) + custom + 80% disclosure
- Wired thread-view.tsx content unlock (replaced empty Phase 32 placeholder onClick)
- Registered /nodes and /nodes/shop routes with lazy loading

## Task Commits

1. **Task 1: Delete coin shop files** — `f324887e`
2. **Task 2: Build Nodes module** — `e8223a10`
3. **Task 3: Wallet + shop pages** — `c410a950`
4. **Task 4: Tipping UI + content unlock** — `29c3aa8b`
5. **Task 5: Register routes** — `fc42850d`

## Files Created/Modified

### Created
- `modules/nodes/` — Complete module: types, services (nodesApi), store (useNodesStore), hooks (useNodes), barrel index
- `modules/nodes/components/` — TipButton, TipModal, BundleCard, TransactionRow, WithdrawalModal
- `pages/nodes/nodes-wallet.tsx` — Balance, transactions, withdrawal
- `pages/nodes/nodes-shop.tsx` — 5 bundles, Stripe Checkout

### Deleted (18 files)
- `pages/premium/coin-shop/` (11 files) + `coin-shop.tsx` entry point
- `modules/premium/components/` coin-package-card, coin-shop-widget, coin-shop-data, useCoinShop
- `modules/premium/components/__tests__/premiumConstants.test.tsx`

### Modified
- `routes/lazyPages.ts` — Removed CoinShop, added NodesWalletPage + NodesShopPage
- `routes/app-routes.tsx` — Removed premium/coins, added /nodes + /nodes/shop
- `modules/premium/components/index.ts` — Removed CoinShopWidget exports
- `pages/premium/index.ts` — Removed CoinShop export
- `thread-view.tsx` — Wired unlock onClick with useUnlockContent mutation, toast, navigate

## Deviations from Plan

None — plan executed as written.

## Issues Encountered

None.
